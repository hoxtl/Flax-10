"""
Tests for AI view endpoints and helper utilities.
"""

from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.models.timer.session_model import StudySession
from studyFlax.models.timer.theme_session_model import ThemeSession

User = get_user_model()


def make_user():
    return User.objects.create_user(
        username='aiuser', email='ai@example.com', password='pass',
        first_name='AI', last_name='User'
    )


def make_session(user, duration=60, status='Completed', days_ago=0):
    now = timezone.now() - timedelta(days=days_ago)
    return StudySession.objects.create(
        user=user, start_time=now - timedelta(minutes=duration), end_time=now,
        duration=duration, break_duration=0, pause_duration=0,
        session_count=1, study_block_id=1, status=status
    )


class BuildUserContextTest(TestCase):

    def setUp(self):
        self.user = make_user()

    def test_build_user_context_no_sessions(self):
        from studyFlax.views.analytics.ai_view import _build_user_context
        context = _build_user_context(self.user, days=30)
        self.assertIn('AI User', context)
        self.assertIn('Total study sessions: 0', context)

    def test_build_user_context_with_sessions(self):
        from studyFlax.views.analytics.ai_view import _build_user_context
        make_session(self.user, duration=60, days_ago=1)
        make_session(self.user, duration=120, days_ago=2)
        context = _build_user_context(self.user, days=30)
        self.assertIn('Total study sessions: 2', context)

    def test_build_user_context_calculates_streak(self):
        from studyFlax.views.analytics.ai_view import _build_user_context
        make_session(self.user, duration=60, days_ago=0)
        make_session(self.user, duration=60, days_ago=1)
        context = _build_user_context(self.user, days=30)
        self.assertIn('Current streak: 2', context)

    def test_build_user_context_broken_streak_is_zero(self):
        from studyFlax.views.analytics.ai_view import _build_user_context
        make_session(self.user, duration=60, days_ago=5)
        context = _build_user_context(self.user, days=30)
        self.assertIn('Current streak: 0', context)

    def test_build_user_context_with_theme_sessions(self):
        from studyFlax.views.analytics.ai_view import _build_user_context
        ThemeSession.objects.create(user=self.user, theme='dark', duration_minutes=120,
            started_at=timezone.now() - timedelta(days=1), ended_at=timezone.now())
        context = _build_user_context(self.user, days=30)
        self.assertIn('Dark mode usage:', context)

    def test_build_user_context_upcoming_events(self):
        from studyFlax.views.analytics.ai_view import _build_user_context
        CalendarEvent.objects.create(user=self.user, title='Upcoming Lecture',
            start_time=timezone.now() + timedelta(days=3),
            end_time=timezone.now() + timedelta(days=3, hours=1))
        context = _build_user_context(self.user, days=30)
        self.assertIn('Upcoming Lecture', context)

    def test_build_user_context_overtime_sessions(self):
        from studyFlax.views.analytics.ai_view import _build_user_context
        make_session(self.user, duration=90, status='Overtime', days_ago=1)
        context = _build_user_context(self.user, days=30)
        self.assertIn('Overtime sessions: 1', context)

    def test_build_user_context_peak_hours(self):
        from studyFlax.views.analytics.ai_view import _build_user_context
        make_session(self.user, duration=60, days_ago=1)
        context = _build_user_context(self.user, days=30)
        self.assertIn('Peak study hour:', context)


class GetAiInsightsViewTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/analytics/ai-insights/', {'days': 30})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('studyFlax.views.analytics.ai_view.openai_available', False)
    def test_returns_503_when_openai_not_installed(self):
        response = self.client.post('/api/analytics/ai-insights/', {'days': 30})
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('OpenAI package', response.data['error'])

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('django.conf.settings.OPENAI_API_KEY', '', create=True)
    def test_returns_503_when_no_api_key(self):
        with patch('studyFlax.views.analytics.ai_view.settings') as mock_settings:
            mock_settings.OPENAI_API_KEY = None
            response = self.client.post('/api/analytics/ai-insights/', {'days': 30})
            self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.OpenAI')
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_returns_insights_on_success(self, mock_settings, mock_openai_cls):
        mock_settings.OPENAI_API_KEY = 'test-key'
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_response = MagicMock()
        mock_response.choices[0].message.content = 'You study well!'
        mock_client.chat.completions.create.return_value = mock_response
        response = self.client.post('/api/analytics/ai-insights/', {'days': 30})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['insights'], 'You study well!')
        self.assertIn('contextUsed', response.data)

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.OpenAI')
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_returns_500_on_openai_error(self, mock_settings, mock_openai_cls):
        mock_settings.OPENAI_API_KEY = 'test-key'
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create.side_effect = Exception('API Error')
        response = self.client.post('/api/analytics/ai-insights/', {'days': 30})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('API Error', response.data['error'])

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.OpenAI')
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_uses_custom_days_param(self, mock_settings, mock_openai_cls):
        mock_settings.OPENAI_API_KEY = 'test-key'
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_response = MagicMock()
        mock_response.choices[0].message.content = 'Insight'
        mock_client.chat.completions.create.return_value = mock_response
        response = self.client.post('/api/analytics/ai-insights/', {'days': 7})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('last 7 days', response.data['contextUsed'])

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_invalid_days_param_returns_400(self, mock_settings):
        mock_settings.OPENAI_API_KEY = 'test-key'
        response = self.client.post('/api/analytics/ai-insights/', {'days': 'notanumber'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('days', response.data['error'])

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.OpenAI')
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_incomplete_openai_response_returns_500(self, mock_settings, mock_openai_cls):
        mock_settings.OPENAI_API_KEY = 'test-key'
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_response = MagicMock()
        mock_response.choices = []
        mock_client.chat.completions.create.return_value = mock_response
        response = self.client.post('/api/analytics/ai-insights/', {'days': 30})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class AiChatViewTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/analytics/ai-chat/', {'messages': []})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('studyFlax.views.analytics.ai_view.openai_available', False)
    def test_returns_503_when_openai_not_installed(self):
        response = self.client.post('/api/analytics/ai-chat/', {'messages': [{'role': 'user', 'content': 'Hi'}]})
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_returns_503_when_no_api_key(self, mock_settings):
        mock_settings.OPENAI_API_KEY = None
        response = self.client.post('/api/analytics/ai-chat/', {'messages': [{'role': 'user', 'content': 'Hi'}]})
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_returns_400_with_no_messages(self, mock_settings):
        mock_settings.OPENAI_API_KEY = 'test-key'
        response = self.client.post('/api/analytics/ai-chat/', {'messages': []})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('messages', response.data['error'])

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.OpenAI')
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_returns_reply_on_success(self, mock_settings, mock_openai_cls):
        mock_settings.OPENAI_API_KEY = 'test-key'
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_response = MagicMock()
        mock_response.choices[0].message.content = 'Here is my reply.'
        mock_client.chat.completions.create.return_value = mock_response
        response = self.client.post(
            '/api/analytics/ai-chat/',
            {'messages': [{'role': 'user', 'content': 'How am I doing?'}]},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reply'], 'Here is my reply.')

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.OpenAI')
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_returns_500_on_openai_error(self, mock_settings, mock_openai_cls):
        mock_settings.OPENAI_API_KEY = 'test-key'
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_client.chat.completions.create.side_effect = Exception('Timeout')
        response = self.client.post(
            '/api/analytics/ai-chat/',
            {'messages': [{'role': 'user', 'content': 'Hi'}]},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Timeout', response.data['error'])

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_missing_messages_key_returns_400(self, mock_settings):
        mock_settings.OPENAI_API_KEY = 'test-key'
        response = self.client.post('/api/analytics/ai-chat/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_invalid_days_param_returns_400(self, mock_settings):
        mock_settings.OPENAI_API_KEY = 'test-key'
        response = self.client.post(
            '/api/analytics/ai-chat/',
            {'messages': [{'role': 'user', 'content': 'Hi'}], 'days': 'bad'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('days', response.data['error'])

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.OpenAI')
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_chat_incomplete_response_returns_500(self, mock_settings, mock_openai_cls):
        mock_settings.OPENAI_API_KEY = 'test-key'
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        mock_response = MagicMock()
        mock_response.choices = []
        mock_client.chat.completions.create.return_value = mock_response
        response = self.client.post(
            '/api/analytics/ai-chat/',
            {'messages': [{'role': 'user', 'content': 'Hi'}]},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class OpenAIResponseValidationTest(TestCase):

    def test_is_openai_response_valid_with_empty_choices(self):
        from studyFlax.views.analytics.ai_view import _is_openai_response_valid
        response = MagicMock()
        response.choices = []
        self.assertFalse(_is_openai_response_valid(response))

    def test_is_openai_response_valid_with_no_choices_attr(self):
        from studyFlax.views.analytics.ai_view import _is_openai_response_valid
        response = MagicMock()
        response.choices = None
        self.assertFalse(_is_openai_response_valid(response))

    def test_extract_days_with_non_integer_string(self):
        from studyFlax.views.analytics.ai_view import _extract_days
        self.assertIsNone(_extract_days('abc'))

    def test_extract_days_with_none_returns_default(self):
        from studyFlax.views.analytics.ai_view import _extract_days
        self.assertEqual(_extract_days(None, 30), 30)


class OpenAIImportCoverageTest(TestCase):
    """Covers the openai import try/except branch."""

    def test_openai_import_branch_with_mock_module(self):
        import importlib
        import sys
        fake_openai = MagicMock()
        fake_openai.OpenAI = MagicMock
        fake_openai.OpenAIError = type('OpenAIError', (Exception,), {})
        sys.modules['openai'] = fake_openai
        try:
            import studyFlax.views.analytics.ai_view as mod
            importlib.reload(mod)
            self.assertTrue(mod.openai_available)
        finally:
            del sys.modules['openai']
            importlib.reload(mod)


class AiScheduleParserTest(TestCase):

    def test_strip_code_fence_with_json_prefix(self):
        from studyFlax.views.analytics.ai_schedule import strip_code_fence
        content = '```json\n[{"title": "Study"}]\n```'
        result = strip_code_fence(content)
        self.assertIn('"title"', result)

    def test_strip_code_fence_without_json_prefix(self):
        from studyFlax.views.analytics.ai_schedule import strip_code_fence
        content = '```\n[{"title": "Study"}]\n```'
        result = strip_code_fence(content)
        self.assertIn('"title"', result)

    def test_parse_schedule_events_returns_empty_for_non_list(self):
        from studyFlax.views.analytics.ai_schedule import parse_schedule_events
        result = parse_schedule_events('{"key": "value"}')
        self.assertEqual(result, [])

    def test_parse_schedule_events_returns_list_on_valid_json(self):
        from studyFlax.views.analytics.ai_schedule import parse_schedule_events
        result = parse_schedule_events('[{"title": "Study"}]')
        self.assertEqual(len(result), 1)


class AiChatScheduleExtractionFailureTest(TestCase):
    """Tests for _extract_schedule_events failure paths (lines 93, 96)."""

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.OpenAI')
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_chat_returns_200_when_schedule_fetch_fails(self, mock_settings, mock_openai_cls):
        mock_settings.OPENAI_API_KEY = 'test-key'
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        main_response = MagicMock()
        main_response.choices[0].message.content = 'Study plan reply.'
        mock_client.chat.completions.create.side_effect = [main_response, Exception('schedule fail')]
        response = self.client.post(
            '/api/analytics/ai-chat/',
            {'messages': [{'role': 'user', 'content': 'Plan my week'}]},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['suggested_events'], [])

    @patch('studyFlax.views.analytics.ai_view.openai_available', True)
    @patch('studyFlax.views.analytics.ai_view.OpenAI')
    @patch('studyFlax.views.analytics.ai_view.settings')
    def test_chat_returns_200_when_schedule_response_incomplete(self, mock_settings, mock_openai_cls):
        mock_settings.OPENAI_API_KEY = 'test-key'
        mock_client = MagicMock()
        mock_openai_cls.return_value = mock_client
        main_response = MagicMock()
        main_response.choices[0].message.content = 'Study plan reply.'
        incomplete = MagicMock()
        incomplete.choices = []
        mock_client.chat.completions.create.side_effect = [main_response, incomplete]
        response = self.client.post(
            '/api/analytics/ai-chat/',
            {'messages': [{'role': 'user', 'content': 'Plan my week'}]},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['suggested_events'], [])
