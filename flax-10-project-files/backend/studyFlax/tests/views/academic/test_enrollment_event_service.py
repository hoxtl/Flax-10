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


class EnsureModulesExistTest(TestCase):
    """Tests for _ensure_modules_exist_for_major in enrollment_logic."""

    def setUp(self):
        from django.utils import timezone
        from datetime import timedelta
        from studyFlax.models.modules.module_model import Module
        self.teacher = User.objects.create_user(
            username='enroll_teacher', email='enroll_teacher@test.com', password='pass', role='teacher',
        )
        Module.objects.create(
            module_code='CS4101',
            module_name='Existing CS Module',
            created_by=self.teacher,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )

    def test_skips_existing_module_code(self):
        from studyFlax.models.modules.module_model import Module
        from studyFlax.views.modules.enrollment_logic import _ensure_modules_exist_for_major
        count_before = Module.objects.filter(module_code='CS4101').count()
        _ensure_modules_exist_for_major(['CS'])
        self.assertEqual(Module.objects.filter(module_code='CS4101').count(), count_before)
