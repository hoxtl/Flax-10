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
from studyFlax.models.calendar.recurrence_rule_model import RecurrenceRule
from studyFlax.models.timer.theme_session_model import ThemeSession

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
        from studyFlax.views.analytics.theme_view import get_theme_stats
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


class RecurrenceEndDateTest(TestCase):
    """Recurrence rule end_date stops instance generation."""

    def test_end_date_stops_recurrence_expansion(self):
        from studyFlax.views.calendar.event_helpers import expand_recurring_events

        now = timezone.now()
        rule = RecurrenceRule.objects.create(
            frequency='daily', interval=1,
            end_date=(now + timedelta(days=2)).date(),
        )
        user = User.objects.create_user(
            username='enddate_user', email='enddate@example.com', password='pass',
        )
        event = CalendarEvent.objects.create(
            user=user, title='Daily', start_time=now,
            end_time=now + timedelta(hours=1), recurrence_rule=rule,
        )
        view_start = now - timedelta(days=1)
        view_end = now + timedelta(days=30)
        instances = expand_recurring_events([event], view_start, view_end)
        for inst in instances:
            self.assertLessEqual(inst.start_time.date(), rule.end_date)


class ApplyFilterNoneRecurringTests(TestCase):
    """_apply_start_end_filter and _apply_start_only_filter with recurring_qs=None."""

    def test_apply_start_end_filter_with_none_recurring(self):
        from studyFlax.views.calendar.event_helpers import _apply_start_end_filter
        from django.db.models import Q

        qs = CalendarEvent.objects.none()
        start = timezone.now()
        end = start + timedelta(days=1)
        non_recurring = Q(recurrence_rule__isnull=True)
        result = _apply_start_end_filter(qs, start, end, None, non_recurring)
        self.assertEqual(result.count(), 0)

    def test_apply_start_only_filter_with_none_recurring(self):
        from studyFlax.views.calendar.event_helpers import _apply_start_only_filter
        from django.db.models import Q

        qs = CalendarEvent.objects.none()
        start = timezone.now()
        non_recurring = Q(recurrence_rule__isnull=True)
        result = _apply_start_only_filter(qs, start, None, non_recurring)
        self.assertEqual(result.count(), 0)

    def test_apply_filter_dispatches_none_recurring(self):
        from studyFlax.views.calendar.event_helpers import apply_filter

        qs = CalendarEvent.objects.none()
        start = timezone.now()
        end = start + timedelta(days=1)
        self.assertEqual(apply_filter(qs, start, end, None).count(), 0)
        self.assertEqual(apply_filter(qs, start, None, None).count(), 0)


class WrapperFunctionCoverageTest(TestCase):
    """Tests for wrapper functions: get_next_occurrence, is_exception_date, should_stop_generating."""

    def test_get_next_occurrence_returns_incremented_date(self):
        from studyFlax.views.calendar.event_helpers import get_next_occurrence
        start = timezone.now()
        result = get_next_occurrence(start, 'daily', 1, 1)
        self.assertIsNotNone(result)

    def test_is_exception_date_true_when_date_in_list(self):
        from studyFlax.views.calendar.event_helpers import is_exception_date
        rule = RecurrenceRule.objects.create(
            frequency='daily', interval=1,
            exception_dates=[timezone.now().strftime('%Y-%m-%d')],
        )
        self.assertTrue(is_exception_date(timezone.now(), rule))

    def test_is_exception_date_false_when_no_exceptions(self):
        from studyFlax.views.calendar.event_helpers import is_exception_date
        rule = RecurrenceRule.objects.create(frequency='daily', interval=1)
        self.assertFalse(is_exception_date(timezone.now(), rule))

    def test_should_stop_generating_true_past_end(self):
        from studyFlax.views.calendar.event_helpers import should_stop_generating
        rule = RecurrenceRule.objects.create(frequency='daily', interval=1)
        future = timezone.now() + timedelta(days=10)
        past_end = timezone.now() - timedelta(days=1)
        self.assertTrue(should_stop_generating(future, past_end, rule))

    def test_should_stop_generating_false_within_range(self):
        from studyFlax.views.calendar.event_helpers import should_stop_generating
        rule = RecurrenceRule.objects.create(frequency='daily', interval=1)
        now = timezone.now()
        self.assertFalse(should_stop_generating(now, now + timedelta(days=5), rule))


class InternalHelperCoverageTest(TestCase):
    """Tests for internal helper branches: None start, exception dates."""

    def test_should_stop_generation_none_start_returns_true(self):
        from studyFlax.views.calendar.event_helpers import _should_stop_generation
        rule = RecurrenceRule.objects.create(frequency='daily', interval=1)
        self.assertTrue(_should_stop_generation(None, timezone.now(), rule))

    def test_is_instance_visible_false_on_exception_date(self):
        from studyFlax.views.calendar.event_helpers import _is_instance_visible
        now = timezone.now()
        rule = RecurrenceRule.objects.create(
            frequency='daily', interval=1,
            exception_dates=[now.strftime('%Y-%m-%d')],
        )
        result = _is_instance_visible(
            now, now + timedelta(hours=1),
            now - timedelta(days=1), now + timedelta(days=1), rule,
        )
        self.assertFalse(result)

    def test_is_occurrence_visible_false_on_none_start(self):
        from studyFlax.views.calendar.event_helpers import _is_occurrence_visible
        rule = RecurrenceRule.objects.create(frequency='daily', interval=1)
        now = timezone.now()
        result = _is_occurrence_visible(
            None, timedelta(hours=1), now, now + timedelta(days=1), rule,
        )
        self.assertFalse(result)

    def test_parse_date_param_makes_naive_datetime_aware(self):
        from studyFlax.views.calendar.event_helpers import parse_date_param
        result = parse_date_param('2026-03-24T10:00:00')
        self.assertIsNotNone(result)
        self.assertTrue(timezone.is_aware(result))
