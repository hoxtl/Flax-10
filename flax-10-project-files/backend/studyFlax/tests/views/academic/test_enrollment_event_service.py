"""
Tests for enrollment event service helpers.
"""

from unittest.mock import patch, MagicMock

from django.contrib.auth import get_user_model
from django.db import OperationalError
from django.test import TestCase

User = get_user_model()


def _make_user():
    return User.objects.create_user(
        username='enroll_svc', email='enroll_svc@test.com', password='pass'
    )


class SafeCreateEnrollmentEventsTest(TestCase):

    def setUp(self):
        self.user = _make_user()
        self.module = MagicMock()

    @patch('studyFlax.views.modules.enrollment_event_service.create_enrollment_events')
    def test_safe_create_calls_create_events(self, mock_create):
        from studyFlax.views.modules.enrollment_event_service import safe_create_enrollment_events
        safe_create_enrollment_events(self.user, self.module)
        mock_create.assert_called_once_with(self.user, self.module)

    @patch('studyFlax.views.modules.enrollment_event_service.log_enrollment_creation_error')
    @patch('studyFlax.views.modules.enrollment_event_service.create_enrollment_events')
    def test_safe_create_catches_operational_error(self, mock_create, mock_log):
        from studyFlax.views.modules.enrollment_event_service import safe_create_enrollment_events
        mock_create.side_effect = OperationalError('DB error')
        safe_create_enrollment_events(self.user, self.module)
        mock_log.assert_called_once_with(self.user, self.module, mock_create.side_effect)


class LogEnrollmentCreationErrorTest(TestCase):

    def setUp(self):
        self.user = _make_user()
        self.module = MagicMock()

    @patch('studyFlax.views.modules.enrollment_event_service.is_running_tests', return_value=False)
    @patch('studyFlax.views.modules.enrollment_event_service.logger')
    def test_logs_debug_when_not_in_test_context(self, mock_logger, _mock_is_testing):
        from studyFlax.views.modules.enrollment_event_service import log_enrollment_creation_error
        exc = OperationalError('DB error')
        log_enrollment_creation_error(self.user, self.module, exc)
        mock_logger.debug.assert_called_once()

    @patch('studyFlax.views.modules.enrollment_event_service.is_running_tests', return_value=True)
    @patch('studyFlax.views.modules.enrollment_event_service.logger')
    def test_skips_debug_when_in_test_context(self, mock_logger, _mock_is_testing):
        from studyFlax.views.modules.enrollment_event_service import log_enrollment_creation_error
        exc = OperationalError('DB error')
        log_enrollment_creation_error(self.user, self.module, exc)
        mock_logger.debug.assert_not_called()
