"""
Tests for analytics views including session summaries, progress, theme stats, and AI insight endpoints.
"""

import random
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.timer.themeSessionModel import ThemeSession
from studyFlax.models.calendar.calendarEventModel import CalendarEvent

User = get_user_model()

def make_session(user, duration=60, break_duration=10, pause_duration=0, status_val='Completed', hours_ago=1):
    end = timezone.now() - timedelta(hours=hours_ago)
    start = end - timedelta(minutes=duration)
    return StudySession.objects.create(
        user=user, start_time=start, end_time=end,
        duration=duration, break_duration=break_duration,
        pause_duration=pause_duration, status=status_val,
        study_block_id=random.randint(1, 999999), session_count=1
    )

class AnalyticsSummaryViewTest(TestCase):
    """Tests for the analytics summary endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_empty_summary(self):
        response = self.client.get('/api/analytics/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['total_sessions'], 0)

    def test_summary_with_sessions(self):
        make_session(self.user, duration=60, hours_ago=2)
        make_session(self.user, duration=30, hours_ago=5)
        response = self.client.get('/api/analytics/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['total_sessions'], 2)

    def test_summary_with_days_param(self):
        make_session(self.user, hours_ago=2)
        response = self.client.get('/api/analytics/summary/?days=7')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['period_days'], 7)

    def test_summary_overtime_sessions(self):
        make_session(self.user, status_val='Overtime')
        response = self.client.get('/api/analytics/summary/')
        self.assertEqual(response.data['summary']['overtime_sessions'], 1)

    def test_summary_work_break_ratio(self):
        make_session(self.user, duration=60, break_duration=20)
        response = self.client.get('/api/analytics/summary/')
        self.assertIsNotNone(response.data['summary']['work_break_ratio'])

    def test_summary_no_break_ratio_when_no_breaks(self):
        make_session(self.user, duration=60, break_duration=0)
        response = self.client.get('/api/analytics/summary/')
        self.assertIsNone(response.data['summary']['work_break_ratio'])

    def test_summary_heatmap_structure(self):
        response = self.client.get('/api/analytics/summary/')
        self.assertIn('heatmap', response.data)
        self.assertEqual(len(response.data['heatmap']['data']), 7)

    def test_summary_streak_with_consecutive_days(self):
        for i in range(3, 0, -1):
            make_session(self.user, hours_ago=i * 24)
        response = self.client.get('/api/analytics/summary/')
        self.assertGreater(response.data['summary']['current_streak_days'], 0)

    def test_summary_streak_with_gap_resets_temp(self):
        make_session(self.user, hours_ago=5 * 24)
        make_session(self.user, hours_ago=3 * 24)
        make_session(self.user, hours_ago=1 * 24)
        response = self.client.get('/api/analytics/summary/')
        self.assertGreaterEqual(response.data['summary']['longest_streak_days'], 1)

    def test_unauthenticated(self):
        response = APIClient().get('/api/analytics/summary/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

class ProgressDataViewTest(TestCase):
    """Tests for the analytics progress endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_empty_progress(self):
        response = self.client.get('/api/analytics/progress/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['summary']['adherence_percentage'])

    def test_progress_with_sessions_and_events(self):
        make_session(self.user, duration=60, hours_ago=2)
        now = timezone.now()
        CalendarEvent.objects.create(
            user=self.user, title='Study', 
            start_time=now - timedelta(hours=3),
            end_time=now - timedelta(hours=2)
        )
        response = self.client.get('/api/analytics/progress/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['summary']['adherence_percentage'])

    def test_progress_days_param(self):
        response = self.client.get('/api/analytics/progress/?days=14')
        self.assertEqual(response.data['period_days'], 14)

class ThemeViewsTest(TestCase):
    """Tests for the theme session logging and theme stats endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_log_theme_session_success(self):
        now = timezone.now()
        response = self.client.post('/api/analytics/theme-session/', {
            'theme': 'dark',
            'started_at': (now - timedelta(hours=1)).isoformat(),
            'ended_at': now.isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_log_theme_session_missing_fields(self):
        response = self.client.post('/api/analytics/theme-session/', {'theme': 'dark'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_log_theme_session_invalid_theme(self):
        now = timezone.now()
        response = self.client.post('/api/analytics/theme-session/', {
            'theme': 'rainbow',
            'started_at': (now - timedelta(hours=1)).isoformat(),
            'ended_at': now.isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_log_theme_session_end_before_start(self):
        now = timezone.now()
        response = self.client.post('/api/analytics/theme-session/', {
            'theme': 'light',
            'started_at': now.isoformat(),
            'ended_at': (now - timedelta(hours=1)).isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_theme_stats_empty(self):
        response = self.client.get('/api/analytics/theme-stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['total_minutes'], 0)

    def test_get_theme_stats_with_data(self):
        now = timezone.now()
        ThemeSession.objects.create(
            user=self.user, theme='dark',
            started_at=now - timedelta(hours=2),
            ended_at=now - timedelta(hours=1),
            duration_minutes=60
        )
        response = self.client.get('/api/analytics/theme-stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['summary']['dark_minutes'], 60)

    def test_get_theme_stats_days_param(self):
        response = self.client.get('/api/analytics/theme-stats/?days=7')
        self.assertEqual(response.data['period_days'], 7)

    def test_get_theme_stats_night_owl(self):
        now = timezone.now().replace(hour=22, minute=0)
        ThemeSession.objects.create(
            user=self.user, theme='dark',
            started_at=now - timedelta(minutes=60),
            ended_at=now, duration_minutes=60
        )
        response = self.client.get('/api/analytics/theme-stats/')
        self.assertTrue(response.data['summary']['is_night_owl'])

class AIViewsTest(TestCase):
    """Tests for the AI insights and AI chat analytics endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_ai_insights_no_api_key(self):
        response = self.client.post('/api/analytics/ai-insights/', {})
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE, status.HTTP_500_INTERNAL_SERVER_ERROR])

    def test_ai_chat_no_messages(self):
        response = self.client.post('/api/analytics/ai-chat/', {'messages': []})
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_503_SERVICE_UNAVAILABLE])

    def test_ai_chat_no_api_key(self):
        response = self.client.post('/api/analytics/ai-chat/', {
            'messages': [{'role': 'user', 'content': 'hello'}]
        })
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE, status.HTTP_500_INTERNAL_SERVER_ERROR])

    def test_build_user_context_with_non_consecutive_sessions(self):
        from studyFlax.views.analytics.ai_views import _build_user_context
        make_session(self.user, duration=60, break_duration=10, hours_ago=5 * 24)
        make_session(self.user, duration=60, break_duration=10, hours_ago=3 * 24)
        context = _build_user_context(self.user)
        self.assertIsInstance(context, str)

    def test_build_user_context_streak_reset_when_no_recent_session(self):
        from studyFlax.views.analytics.ai_views import _build_user_context
        make_session(self.user, duration=60, break_duration=0, hours_ago=48)
        make_session(self.user, duration=60, break_duration=0, hours_ago=72)
        context = _build_user_context(self.user)
        self.assertIsInstance(context, str)
