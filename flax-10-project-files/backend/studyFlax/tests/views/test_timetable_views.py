"""
Backend tests for timetable service helpers.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, timezone as dt_timezone

from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models.calendar.timetableSourceModel import TimetableSource


User = get_user_model()


SAMPLE_ICS = """BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260101T100000Z
DTEND:20260101T120000Z
SUMMARY:Test Lecture
DESCRIPTION:A test event
LOCATION:Room 101
UID:test-uid-001@example.com
END:VEVENT
END:VCALENDAR"""

SAMPLE_ICS_NO_END = """BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:20260101T100000Z
SUMMARY:Bad Event
UID:bad-uid@example.com
END:VEVENT
END:VCALENDAR"""


class TimetableServiceUnitTest(TestCase):
    """Unit tests for timetable_service.py helpers."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="ttuser", email="tt@example.com", password="pass"
        )

    def test_get_source_key_strips_www(self):
        from studyFlax.views.calendar.timetable_service import get_source_key

        self.assertEqual(
            get_source_key("https://www.example.com/feed.ics"), "example.com"
        )

    def test_get_source_key_no_host(self):
        from studyFlax.views.calendar.timetable_service import get_source_key

        self.assertEqual(get_source_key("feed.ics"), "timetable")

    def test_resolve_ics_url_direct(self):
        from studyFlax.views.calendar.timetable_service import resolve_ics_url

        result = resolve_ics_url("https://example.com/feed.ICS")
        self.assertEqual(result, "https://example.com/feed.ICS")

    @patch("studyFlax.views.calendar.timetable_service.fetch_url_text")
    def test_resolve_ics_url_from_html(self, mock_fetch):
        from studyFlax.views.calendar.timetable_service import resolve_ics_url

        mock_fetch.return_value = '<a href="https://example.com/cal.ics">Download</a>'
        result = resolve_ics_url("https://example.com/page")
        self.assertEqual(result, "https://example.com/cal.ics")

    @patch("studyFlax.views.calendar.timetable_service.fetch_url_text")
    def test_resolve_ics_url_relative_path(self, mock_fetch):
        from studyFlax.views.calendar.timetable_service import resolve_ics_url

        mock_fetch.return_value = '<a href="/feeds/cal.ics">Download</a>'
        result = resolve_ics_url("https://example.com/page")
        self.assertIn("cal.ics", result)

    @patch("studyFlax.views.calendar.timetable_service.fetch_url_text")
    def test_resolve_ics_url_not_found(self, mock_fetch):
        from studyFlax.views.calendar.timetable_service import resolve_ics_url

        mock_fetch.return_value = "<html><body>No ics link here</body></html>"
        result = resolve_ics_url("https://example.com/page")
        self.assertIsNone(result)

    def test_extract_ics_url_found(self):
        from studyFlax.views.calendar.timetable_service import extract_ics_url

        html = 'Download <a href="https://cal.example.com/feed.ics">here</a>'
        result = extract_ics_url(html, "https://example.com")
        self.assertEqual(result, "https://cal.example.com/feed.ics")

    def test_extract_ics_url_not_found(self):
        from studyFlax.views.calendar.timetable_service import extract_ics_url

        result = extract_ics_url("<html>no link</html>", "https://example.com")
        self.assertIsNone(result)

    def test_parse_ics_events(self):
        from studyFlax.views.calendar.timetable_service import parse_ics_events

        events = parse_ics_events(SAMPLE_ICS, "example.com")
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["title"], "Test Lecture")
        self.assertEqual(events[0]["source"], "example.com")

    def test_parse_ics_events_skips_no_end(self):
        from studyFlax.views.calendar.timetable_service import parse_ics_events

        events = parse_ics_events(SAMPLE_ICS_NO_END, "example.com")
        self.assertEqual(len(events), 0)

    def test_parse_vevent_returns_none_if_missing_start(self):
        from studyFlax.views.calendar.timetable_service import parse_vevent

        vevent = MagicMock()
        vevent.get = (
            lambda key, default=None: None
            if key == "DTSTART"
            else MagicMock()
        )
        result = parse_vevent(vevent, "src")
        self.assertIsNone(result)

    def test_parse_ics_datetime_none(self):
        from studyFlax.views.calendar.timetable_service import parse_ics_datetime

        self.assertIsNone(parse_ics_datetime(None))

    def test_parse_ics_datetime_date_only(self):
        from studyFlax.views.calendar.timetable_service import parse_ics_datetime

        result = parse_ics_datetime("20260101")
        self.assertIsNotNone(result)

    def test_parse_ics_datetime_utc(self):
        from studyFlax.views.calendar.timetable_service import parse_ics_datetime

        result = parse_ics_datetime("20260101T100000Z")
        self.assertIsNotNone(result)
        self.assertEqual(result.tzinfo, dt_timezone.utc)

    def test_parse_ics_datetime_local(self):
        from studyFlax.views.calendar.timetable_service import parse_ics_datetime

        result = parse_ics_datetime("20260101T100000")
        self.assertIsNotNone(result)

    def test_parse_ics_datetime_short(self):
        from studyFlax.views.calendar.timetable_service import parse_ics_datetime

        result = parse_ics_datetime("20260101T1000")
        self.assertIsNotNone(result)

    def test_to_aware_naive_becomes_aware(self):
        from studyFlax.views.calendar.timetable_service import to_aware

        naive = datetime(2026, 1, 1, 10, 0)
        result = to_aware(naive)
        self.assertTrue(timezone.is_aware(result))

    def test_to_aware_already_aware(self):
        from studyFlax.views.calendar.timetable_service import to_aware

        aware = datetime(2026, 1, 1, 10, 0, tzinfo=dt_timezone.utc)
        result = to_aware(aware)
        self.assertEqual(result, aware)

    def test_is_valid_event_true(self):
        from studyFlax.views.calendar.timetable_service import is_valid_event

        self.assertTrue(is_valid_event({"start_time": "x", "end_time": "y"}))

    def test_is_valid_event_false_missing_end(self):
        from studyFlax.views.calendar.timetable_service import is_valid_event

        self.assertFalse(is_valid_event({"start_time": "x"}))

    def test_should_sync_no_last_synced(self):
        from studyFlax.views.calendar.timetable_service import should_sync

        source = TimetableSource(last_synced=None)
        self.assertTrue(should_sync(source, timedelta(hours=6)))

    def test_should_sync_recently_synced(self):
        from studyFlax.views.calendar.timetable_service import should_sync

        source = TimetableSource(
            last_synced=timezone.now() - timedelta(hours=1)
        )
        self.assertFalse(should_sync(source, timedelta(hours=6)))

    def test_should_sync_old_enough(self):
        from studyFlax.views.calendar.timetable_service import should_sync

        source = TimetableSource(
            last_synced=timezone.now() - timedelta(hours=8)
        )
        self.assertTrue(should_sync(source, timedelta(hours=6)))

    def test_find_existing_event_found(self):
        from studyFlax.views.calendar.timetable_service import (
            find_existing_event,
        )

        CalendarEvent.objects.create(
            user=self.user,
            source="test.com",
            external_id="uid-001",
            title="X",
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )
        result = find_existing_event("test.com", "uid-001", self.user)
        self.assertIsNotNone(result)

    def test_find_existing_event_not_found(self):
        from studyFlax.views.calendar.timetable_service import (
            find_existing_event,
        )

        result = find_existing_event("test.com", "nonexistent", self.user)
        self.assertIsNone(result)

    def test_find_existing_event_no_source(self):
        from studyFlax.views.calendar.timetable_service import (
            find_existing_event,
        )

        result = find_existing_event(None, "uid", None)
        self.assertIsNone(result)

    def test_find_existing_event_no_external_id(self):
        from studyFlax.views.calendar.timetable_service import (
            find_existing_event,
        )

        result = find_existing_event("test.com", None, None)
        self.assertIsNone(result)

    def test_create_event(self):
        from studyFlax.views.calendar.timetable_service import create_event

        start = timezone.now()
        end = start + timedelta(hours=1)
        create_event(
            {
                "title": "Created",
                "description": "Desc",
                "start_time": start,
                "end_time": end,
                "location": "Room 1",
                "source": "test",
                "external_id": "uid-abc",
            },
            self.user,
        )
        self.assertTrue(
            CalendarEvent.objects.filter(external_id="uid-abc").exists()
        )

    def test_apply_event_updates(self):
        from studyFlax.views.calendar.timetable_service import (
            apply_event_updates,
        )

        start = timezone.now()
        end = start + timedelta(hours=1)
        event = CalendarEvent.objects.create(
            user=self.user,
            source="test",
            external_id="upd-001",
            title="Old",
            start_time=start,
            end_time=end,
        )
        apply_event_updates(event, {"title": "New", "description": "Updated"})
        event.refresh_from_db()
        self.assertEqual(event.title, "New")

    def test_upsert_event_creates_new(self):
        from studyFlax.views.calendar.timetable_service import upsert_event

        start = timezone.now()
        end = start + timedelta(hours=1)
        result = upsert_event(
            {
                "title": "New",
                "description": "",
                "start_time": start,
                "end_time": end,
                "location": "",
                "source": "test",
                "external_id": "new-uid",
            },
            self.user,
        )
        self.assertEqual(result, "created")
        self.assertTrue(
            CalendarEvent.objects.filter(external_id="new-uid").exists()
        )

    def test_upsert_event_updates_existing(self):
        from studyFlax.views.calendar.timetable_service import upsert_event

        start = timezone.now()
        end = start + timedelta(hours=1)
        CalendarEvent.objects.create(
            user=self.user,
            source="test",
            external_id="existing-uid",
            title="Old",
            start_time=start,
            end_time=end,
        )
        result = upsert_event(
            {
                "title": "Updated",
                "description": "",
                "start_time": start,
                "end_time": end,
                "location": "",
                "source": "test",
                "external_id": "existing-uid",
            },
            self.user,
        )
        self.assertEqual(result, "updated")

    def test_count_result_updated(self):
        from studyFlax.views.calendar.timetable_service import count_result

        created, updated = count_result("updated", 0, 0)
        self.assertEqual((created, updated), (0, 1))

    def test_count_result_created(self):
        from studyFlax.views.calendar.timetable_service import count_result

        created, updated = count_result("created", 0, 0)
        self.assertEqual((created, updated), (1, 0))

    def test_process_event_invalid_skipped(self):
        from studyFlax.views.calendar.timetable_service import process_event

        created, updated = process_event({"title": "Bad"}, self.user, 0, 0)
        self.assertEqual((created, updated), (0, 0))

    def test_process_event_valid_creates(self):
        from studyFlax.views.calendar.timetable_service import process_event

        start = timezone.now()
        end = start + timedelta(hours=1)
        created, updated = process_event(
            {
                "title": "Good",
                "start_time": start,
                "end_time": end,
                "source": "test",
                "external_id": "proc-uid",
            },
            self.user,
            0,
            0,
        )
        self.assertEqual(created, 1)

    def test_upsert_events(self):
        from studyFlax.views.calendar.timetable_service import upsert_events

        start = timezone.now()
        end = start + timedelta(hours=1)
        events = [
            {
                "title": "E1",
                "start_time": start,
                "end_time": end,
                "source": "x",
                "external_id": "e1",
            },
            {
                "title": "E2",
                "start_time": start,
                "end_time": end,
                "source": "x",
                "external_id": "e2",
            },
            {"title": "Bad"},
        ]
        created, updated = upsert_events(events, self.user)
        self.assertEqual(created, 2)
        self.assertEqual(updated, 0)

    def test_update_source_status_success(self):
        from studyFlax.views.calendar.timetable_service import update_source_status

        update_source_status("https://example.com/cal.ics", self.user, True, "")
        source = TimetableSource.objects.get(user=self.user)
        self.assertIsNotNone(source.last_synced)
        self.assertEqual(source.last_error, "")

    def test_update_source_status_failure(self):
        from studyFlax.views.calendar.timetable_service import update_source_status

        update_source_status(
            "https://example.com/cal.ics",
            self.user,
            False,
            "Connection error",
        )
        source = TimetableSource.objects.get(user=self.user)
        self.assertIsNone(source.last_synced)
        self.assertEqual(source.last_error, "Connection error")

    def test_sync_timetable_if_needed_no_source(self):
        from studyFlax.views.calendar.timetable_service import (
            sync_timetable_if_needed,
        )

        result = sync_timetable_if_needed(self.user)
        self.assertIsNone(result)

    def test_sync_timetable_if_needed_recently_synced(self):
        from studyFlax.views.calendar.timetable_service import (
            sync_timetable_if_needed,
        )

        TimetableSource.objects.create(
            user=self.user,
            source_url="https://example.com/cal.ics",
            last_synced=timezone.now() - timedelta(hours=1),
        )
        result = sync_timetable_if_needed(self.user)
        self.assertIsNone(result)

    @patch("studyFlax.views.calendar.timetable_service.sync_timetable")
    def test_sync_timetable_if_needed_calls_sync(self, mock_sync):
        from studyFlax.views.calendar.timetable_service import (
            sync_timetable_if_needed,
        )

        mock_sync.return_value = {"created": 1, "updated": 0}
        TimetableSource.objects.create(
            user=self.user,
            source_url="https://example.com/cal.ics",
            last_synced=timezone.now() - timedelta(hours=8),
        )
        result = sync_timetable_if_needed(self.user)
        self.assertIsNotNone(result)
        mock_sync.assert_called_once()

    @patch("studyFlax.views.calendar.timetable_service.load_events")
    @patch("studyFlax.views.calendar.timetable_service.upsert_events")
    @patch("studyFlax.views.calendar.timetable_service.update_source_status")
    def test_sync_timetable_success(
        self, mock_status, mock_upsert, mock_load
    ):
        from studyFlax.views.calendar.timetable_service import sync_timetable

        mock_load.return_value = []
        mock_upsert.return_value = (2, 1)
        result = sync_timetable("https://example.com/cal.ics", self.user)
        self.assertEqual(result["created"], 2)
        self.assertEqual(result["updated"], 1)
        mock_status.assert_called_once_with(
            "https://example.com/cal.ics", self.user, True, ""
        )

    @patch("studyFlax.views.calendar.timetable_service.load_events")
    @patch("studyFlax.views.calendar.timetable_service.update_source_status")
    def test_sync_timetable_failure(self, mock_status, mock_load):
        from studyFlax.views.calendar.timetable_service import sync_timetable

        mock_load.side_effect = ValueError("No .ics link found")
        with self.assertRaises(ValueError):
            sync_timetable("https://example.com/page", self.user)
        mock_status.assert_called_once()
        args = mock_status.call_args[0]
        self.assertFalse(args[2])

    @patch("studyFlax.views.calendar.timetable_service.resolve_ics_url")
    def test_load_events_no_ics_raises(self, mock_resolve):
        from studyFlax.views.calendar.timetable_service import load_events

        mock_resolve.return_value = None
        with self.assertRaises(ValueError, msg="No .ics link found"):
            load_events("https://example.com/page", "example.com")

    @patch("studyFlax.views.calendar.timetable_service.fetch_url_text")
    @patch("studyFlax.views.calendar.timetable_service.resolve_ics_url")
    def test_load_events_success(self, mock_resolve, mock_fetch):
        from studyFlax.views.calendar.timetable_service import load_events

        mock_resolve.return_value = "https://example.com/cal.ics"
        mock_fetch.return_value = SAMPLE_ICS
        events = load_events("https://example.com/cal.ics", "example.com")
        self.assertEqual(len(events), 1)

    def test_update_event_field_sets_value(self):
        from studyFlax.views.calendar.timetable_service import update_event_field

        event = MagicMock()
        update_event_field(event, "title", {"title": "Hello"})
        self.assertEqual(event.title, "Hello")

    def test_update_event_field_skips_missing(self):
        from studyFlax.views.calendar.timetable_service import update_event_field

        event = MagicMock()
        event.title = "Original"
        update_event_field(event, "title", {})
        self.assertEqual(event.title, "Original")

    def test_try_parse_format_valid(self):
        from studyFlax.views.calendar.timetable_service import try_parse_format

        result = try_parse_format("20260101T100000", "%Y%m%dT%H%M%S")
        self.assertIsNotNone(result)

    def test_try_parse_format_invalid(self):
        from studyFlax.views.calendar.timetable_service import try_parse_format

        result = try_parse_format("bad-format", "%Y%m%dT%H%M%S")
        self.assertIsNone(result)

"""
Backend tests for timetable API views.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from unittest.mock import patch

User = get_user_model()

class TimetableViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='tvuser', email='tv@example.com', password='pass'
        )
        self.client.force_authenticate(user=self.user)

    def test_import_missing_url(self):
        response = self.client.post('/api/timetable/import/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('source_url', response.data['detail'].lower())

    def test_import_invalid_protocol(self):
        response = self.client.post('/api/timetable/import/', {'source_url': 'ftp://bad.com/cal.ics'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('protocol', response.data['detail'].lower())

    def test_import_empty_url(self):
        response = self.client.post('/api/timetable/import/', {'source_url': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('studyFlax.views.calendar.timetable_views.sync_timetable')
    def test_import_success(self, mock_sync):
        mock_sync.return_value = {'created': 3, 'updated': 0, 'source_url': 'https://example.com/cal.ics'}
        response = self.client.post('/api/timetable/import/', {'source_url': 'https://example.com/cal.ics'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 3)

    @patch('studyFlax.views.calendar.timetable_views.sync_timetable')
    def test_import_value_error(self, mock_sync):
        mock_sync.side_effect = ValueError('No .ics link found')
        response = self.client.post('/api/timetable/import/', {'source_url': 'https://example.com/page'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No .ics', response.data['detail'])

    def test_import_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/timetable/import/', {'source_url': 'https://example.com/cal.ics'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_validate_source_url_strips_whitespace(self):
        from studyFlax.views.calendar.timetable_views import validate_source_url
        url, err = validate_source_url('  https://example.com/cal.ics  extra')
        self.assertEqual(url, 'https://example.com/cal.ics')
        self.assertIsNone(err)

    def test_validate_source_url_none(self):
        from studyFlax.views.calendar.timetable_views import validate_source_url
        url, err = validate_source_url(None)
        self.assertIsNone(url)
        self.assertIsNotNone(err)
