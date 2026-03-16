"""
Focused tests for uncovered calendar event helper branches.
"""

from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from studyFlax.models import CalendarEvent, User
from studyFlax.models.calendar.recurrenceRuleModel import RecurrenceRule
from studyFlax.models.timer.themeSessionModel import ThemeSession

class EventHelpersCoverageTest(TestCase):
    """Tests for event helpers coverage."""
    def test_parse_date_param_returns_datetime(self):
        from studyFlax.views.calendar.event_helpers import parse_date_param
        result = parse_date_param('2026-03-01T10:00:00Z')
        self.assertEqual(result.isoformat(), '2026-03-01T10:00:00+00:00')

    def test_get_base_instance_skips_exception_dates(self):
        from studyFlax.views.calendar.event_helpers import get_base_instance

        class Rule:
            exception_dates = [timezone.now().strftime('%Y-%m-%d')]

        class Event:
            start_time = timezone.now()
            end_time = start_time + timedelta(hours=1)

        self.assertEqual(get_base_instance(Event(), Rule()), [])

class CalendarAndAnalyticsHelperCoverageTest(TestCase):
    """Tests for calendar and analytics helper branches."""

    def test_apply_filter_start_only_and_end_only(self):
        from studyFlax.views.calendar.event_helpers import apply_filter
        qs = CalendarEvent.objects.none()
        start = timezone.now()
        end = start + timedelta(days=1)
        self.assertEqual(apply_filter(qs, start, None, None).count(), 0)
        self.assertEqual(apply_filter(qs, None, end, None).count(), 0)
        self.assertEqual(apply_filter(qs, start, end, None).count(), 0)

    def test_generate_instances_without_range_returns_base_event(self):
        from studyFlax.views.calendar.event_helpers import generate_instances
        rule = RecurrenceRule.objects.create(frequency='daily', interval=1)
        event = SimpleNamespace(
            id=1,
            title='Recurring',
            description='Desc',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
            location='Room',
            tag=None,
            recurrence_rule=rule,
            reminder_minutes=None,
            module=None,
        )
        self.assertEqual(generate_instances(event, None, None), [event])

    def test_theme_stats_peak_light_hour_branch(self):
        from studyFlax.views.analytics.theme_views import get_theme_stats
        user = User.objects.create_user(username='theme_cov', email='theme_cov@example.com', password='pass')
        ThemeSession.objects.create(
            user=user,
            theme='light',
            started_at=timezone.now().replace(hour=13, minute=0, second=0, microsecond=0),
            ended_at=timezone.now().replace(hour=14, minute=0, second=0, microsecond=0),
            duration_minutes=60,
        )
        request = self._make_request(user, 'get')
        response = get_theme_stats(request)
        self.assertEqual(response.data['summary']['peak_light_hour'], '1pm')

    def _make_request(self, user, method):
        factory = APIRequestFactory()
        request = getattr(factory, method)('/')
        force_authenticate(request, user=user)
        return request

class TimetableServiceCoverageTest(TestCase):
    """Tests for timetable_service branches."""

    def test_sync_timetable_if_needed_anonymous_user(self):
        from studyFlax.views.calendar.timetable_service import sync_timetable_if_needed
        from django.contrib.auth.models import AnonymousUser
        result = sync_timetable_if_needed(AnonymousUser())
        self.assertIsNone(result)

    def test_fetch_url_text_mocked(self):
        from studyFlax.views.calendar.timetable_service import fetch_url_text
        mock_response = MagicMock()
        mock_response.read.return_value = b'BEGIN:VCALENDAR\nEND:VCALENDAR'
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        with patch('studyFlax.views.calendar.timetable_service.urlopen', return_value=mock_response):
            result = fetch_url_text('http://example.com/test.ics')
        self.assertIn('VCALENDAR', result)

class EventHelperCoverageTest(TestCase):
    """Tests for event_helper functions not yet covered."""

    def test_add_years_leap_day(self):
        from studyFlax.views.calendar.event_helpers import add_years
        from datetime import datetime, timezone as dt_timezone
        leap_day = datetime(2000, 2, 29, 12, 0, tzinfo=dt_timezone.utc)
        result = add_years(leap_day, 1)
        self.assertEqual(result.day, 28)

    def test_get_base_instance_returns_event_when_no_exception(self):
        from studyFlax.views.calendar.event_helpers import get_base_instance
        rule = RecurrenceRule.objects.create(frequency='weekly', interval=1)
        event = SimpleNamespace(
            start_time=timezone.now(),
            recurrence_rule=rule,
        )
        result = get_base_instance(event, rule)
        self.assertEqual(result, [event])
