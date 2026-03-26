"""
Tests for the AI user context builder helper.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.models.timer.session_model import StudySession
from studyFlax.models.timer.theme_session_model import ThemeSession


User = get_user_model()


def _make_user():
    return User.objects.create_user(
        username='ctx_user', email='ctx@example.com', password='pass',
        first_name='AI', last_name='User'
    )

def _make_session(user, duration=60, study_status='Completed', days_ago=0):
    now = timezone.now() - timedelta(days=days_ago)
    return StudySession.objects.create(
        user=user, start_time=now - timedelta(minutes=duration), end_time=now,
        duration=duration, break_duration=0, pause_duration=0,
        session_count=1, study_block_id=1, status=study_status
    )


class BuildUserContextTest(TestCase):
    """Tests for the _build_user_context helper."""

    def setUp(self):
        """Set up the test case."""
        self.user = _make_user()

    def test_build_user_context_no_sessions(self):
        """Test context building with no sessions."""
        from studyFlax.views.analytics.ai_view import _build_user_context
        context = _build_user_context(self.user, days=30)
        self.assertIn('AI User', context)
        self.assertIn('Total study sessions: 0', context)

    def test_build_user_context_with_sessions(self):
        """Test context building with sessions."""
        from studyFlax.views.analytics.ai_view import _build_user_context
        _make_session(self.user, duration=60, days_ago=1)
        _make_session(self.user, duration=120, days_ago=2)
        context = _build_user_context(self.user, days=30)
        self.assertIn('Total study sessions: 2', context)

    def test_build_user_context_calculates_streak(self):
        """Test context building calculates streaks."""
        from studyFlax.views.analytics.ai_view import _build_user_context
        _make_session(self.user, duration=60, days_ago=0)
        _make_session(self.user, duration=60, days_ago=1)
        context = _build_user_context(self.user, days=30)
        self.assertIn('Current streak: 2', context)

    def test_build_user_context_broken_streak_is_zero(self):
        """Test broken streaks return zero."""
        from studyFlax.views.analytics.ai_view import _build_user_context
        _make_session(self.user, duration=60, days_ago=5)
        context = _build_user_context(self.user, days=30)
        self.assertIn('Current streak: 0', context)

    def test_build_user_context_with_theme_sessions(self):
        """Test context building includes theme sessions."""
        from studyFlax.views.analytics.ai_view import _build_user_context
        ThemeSession.objects.create(user=self.user, theme='dark', duration_minutes=120,
            started_at=timezone.now() - timedelta(days=1), ended_at=timezone.now())
        context = _build_user_context(self.user, days=30)
        self.assertIn('Dark mode usage:', context)

    def test_build_user_context_upcoming_events(self):
        """Test context building includes upcoming events."""
        from studyFlax.views.analytics.ai_view import _build_user_context
        CalendarEvent.objects.create(user=self.user, title='Upcoming Lecture',
            start_time=timezone.now() + timedelta(days=3),
            end_time=timezone.now() + timedelta(days=3, hours=1))
        context = _build_user_context(self.user, days=30)
        self.assertIn('Upcoming Lecture', context)

    def test_build_user_context_overtime_sessions(self):
        """Test context building counts overtime sessions."""
        from studyFlax.views.analytics.ai_view import _build_user_context
        _make_session(self.user, duration=90, study_status='Overtime', days_ago=1)
        context = _build_user_context(self.user, days=30)
        self.assertIn('Overtime sessions: 1', context)

    def test_build_user_context_peak_hours(self):
        """Test context building includes peak hours."""
        from studyFlax.views.analytics.ai_view import _build_user_context
        _make_session(self.user, duration=60, days_ago=1)
        context = _build_user_context(self.user, days=30)
        self.assertIn('Peak study hour:', context)
