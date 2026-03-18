"""Tests for timetable ICS parsing and URL resolution helpers."""

from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone as dt_timezone

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

class TimetableParsingTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="ttparser", email="ttp@example.com", password="pass"
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
        self.assertTrue(result.tzinfo is not None)

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
