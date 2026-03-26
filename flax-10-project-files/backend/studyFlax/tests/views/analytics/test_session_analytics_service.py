"""
Tests for session_analytics_service utility functions.
"""

from datetime import timedelta
from unittest.mock import MagicMock

from django.test import TestCase
from django.utils import timezone


def _mock_session(end_time, duration):
    s = MagicMock()
    s.end_time = end_time
    s.duration = duration
    return s


class ComputeAverageDurationTest(TestCase):
    """Tests compute average duration."""

    def test_empty_sessions_returns_zero(self):
        from studyFlax.views.analytics.session_analytics_service import compute_average_duration
        self.assertEqual(compute_average_duration([]), 0)

    def test_average_with_multiple_sessions(self):
        from studyFlax.views.analytics.session_analytics_service import compute_average_duration
        sessions = [_mock_session(timezone.now(), 60), _mock_session(timezone.now(), 120)]
        self.assertEqual(compute_average_duration(sessions), 90)

    def test_single_session_returns_its_duration(self):
        from studyFlax.views.analytics.session_analytics_service import compute_average_duration
        sessions = [_mock_session(timezone.now(), 45)]
        self.assertEqual(compute_average_duration(sessions), 45)


class ComputeRecentActiveDaysTest(TestCase):
    """Tests compute recent active days."""

    def test_session_within_window_counts(self):
        from studyFlax.views.analytics.session_analytics_service import compute_recent_active_days
        s = _mock_session(timezone.now() - timedelta(days=1), 60)
        self.assertEqual(compute_recent_active_days([s], days=7), 1)

    def test_session_outside_window_excluded(self):
        from studyFlax.views.analytics.session_analytics_service import compute_recent_active_days
        s = _mock_session(timezone.now() - timedelta(days=10), 60)
        self.assertEqual(compute_recent_active_days([s], days=7), 0)

    def test_multiple_sessions_same_day_count_as_one(self):
        from studyFlax.views.analytics.session_analytics_service import compute_recent_active_days
        noon = timezone.now().replace(hour=12, minute=0, second=0, microsecond=0)
        sessions = [_mock_session(noon - timedelta(hours=1), 60), _mock_session(noon - timedelta(hours=2), 30)]
        self.assertEqual(compute_recent_active_days(sessions, days=7), 1)


class ComputeActiveDaysTest(TestCase):
    """Tests compute active days."""

    def test_multiple_sessions_same_day_count_once(self):
        from studyFlax.views.analytics.session_analytics_service import compute_active_days
        noon = timezone.now().replace(hour=12, minute=0, second=0, microsecond=0)
        sessions = [_mock_session(noon, 60), _mock_session(noon - timedelta(hours=1), 30)]
        self.assertEqual(compute_active_days(sessions), 1)

    def test_sessions_on_different_days(self):
        from studyFlax.views.analytics.session_analytics_service import compute_active_days
        now = timezone.now()
        sessions = [_mock_session(now, 60), _mock_session(now - timedelta(days=1), 30)]
        self.assertEqual(compute_active_days(sessions), 2)

    def test_empty_sessions_returns_zero(self):
        from studyFlax.views.analytics.session_analytics_service import compute_active_days
        self.assertEqual(compute_active_days([]), 0)


class FmtHourTest(TestCase):
    """Tests fmt hour."""

    def test_midnight_formats_as_12am(self):
        from studyFlax.views.analytics.session_analytics_service import fmt_hour
        self.assertEqual(fmt_hour(0), '12am')

    def test_noon_formats_as_12pm(self):
        from studyFlax.views.analytics.session_analytics_service import fmt_hour
        self.assertEqual(fmt_hour(12), '12pm')

    def test_morning_hour(self):
        from studyFlax.views.analytics.session_analytics_service import fmt_hour
        self.assertEqual(fmt_hour(9), '9am')

    def test_afternoon_hour(self):
        from studyFlax.views.analytics.session_analytics_service import fmt_hour
        self.assertEqual(fmt_hour(15), '3pm')

    def test_none_returns_none(self):
        from studyFlax.views.analytics.session_analytics_service import fmt_hour
        self.assertIsNone(fmt_hour(None))
