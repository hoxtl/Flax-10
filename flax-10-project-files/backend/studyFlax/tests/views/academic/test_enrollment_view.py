"""
Backend tests for enrollment views.
"""

from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework import status

from ...helpers.test_case_support import BaseTestCase
from studyFlax.models import Module, Enrollment, CalendarEvent, Deadline, User
from studyFlax.models.auth.user_settings_model import UserSettings


class EnrollmentViewTests(BaseTestCase):
    """Tests for enrollment views."""

    def setUp(self):
        super().setUp()
        self.user.role = 'teacher'
        self.user.save()
        self.module = Module.objects.create(
            module_code='5CCS2SEG', module_name='Software Enfineering',
            created_by=self.user,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )
        self.user.role = 'student'
        self.user.save()

    def test_student_can_enroll(self):
        response = self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_enrollment_creates_calendar_event(self):
        self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        self.assertTrue(CalendarEvent.objects.filter(user=self.user, source='module_enrollment').exists())

    def test_duplicate_enrollment_is_invalid(self):
        self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        response = self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_cannot_enroll(self):
        self.user.role = 'teacher'
        self.user.save()
        response=self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_enrollments(self):
        Enrollment.objects.create(student=self.user, module=self.module)
        response = self.client.get('/api/enrollments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_student_can_disenroll(self):
        enrollment = Enrollment.objects.create(student=self.user, module=self.module)
        response = self.client.delete(f'/api/enrollments/{enrollment.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Enrollment.objects.filter(id=enrollment.id).exists())

    def test_disenroll_removes_calendar_events(self):
        enrollment = Enrollment.objects.create(student=self.user, module=self.module)
        CalendarEvent.objects.create(
            user=self.user, module=self.module, title='Lecture',
            source='module_enrollment',
            start_time=self.module.start_time, end_time=self.module.end_time,
        )
        self.client.delete(f'/api/enrollments/{enrollment.id}/')
        self.assertFalse(CalendarEvent.objects.filter(
            user=self.user, module=self.module
        ).exists())

    def test_get_enrollment_detail(self):
        enrollment = Enrollment.objects.create(student=self.user, module=self.module)
        response = self.client.get(f'/api/enrollments/{enrollment.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_enrollment_creates_deadline_events(self):
        self.user.role = 'teacher'
        self.user.save()
        Deadline.objects.create(
            module=self.module, title='CW1',
            deadline_type='coursework',
            start_due_date=timezone.now() + timedelta(days=7),
        )
        self.user.role = 'student'
        self.user.save()
        self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        self.assertTrue(CalendarEvent.objects.filter(
            user=self.user, source='module_deadline'
        ).exists())

    def test_cannot_disenroll_another_user(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other = User.objects.create_user(username='other_enroll', email='other_enroll@test.com', password='pass')
        enrollment = Enrollment.objects.create(student=other, module=self.module)
        response = self.client.delete(f'/api/enrollments/{enrollment.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_disenroll_from_core_module(self):
        UserSettings.objects.create(user=self.user, major='Computer Science')
        enrollment = Enrollment.objects.create(student=self.user, module=self.module)
        with patch('studyFlax.views.modules.enrollment_logic.get_course_prefixes', return_value=['5C']):
            response = self.client.delete(f'/api/enrollments/{enrollment.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

class ModuleAndEnrollmentHelperCoverageTest(TestCase):
    """Tests for module and enrollment helper function branches."""

    def setUp(self):
        self.student = User.objects.create_user(username='student_cov', email='student_cov@example.com', password='pass')
        self.teacher = User.objects.create_user(username='teacher_cov', email='teacher_cov@example.com', password='pass')
        self.teacher.role = 'teacher'
        self.teacher.save()
        self.module = Module.objects.create(
            module_code='CS200',
            module_name='Coverage Systems',
            created_by=self.teacher,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )

    def test_is_core_module_false_without_settings(self):
        from studyFlax.views.modules.enrollment_view import is_core_module
        self.assertFalse(is_core_module(self.student, self.module))

    @patch('studyFlax.views.modules.enrollment_logic.get_course_prefixes', return_value=['CS'])
    def test_is_core_module_true_with_matching_prefix(self, _mock_prefixes):
        from studyFlax.views.modules.enrollment_view import is_core_module
        UserSettings.objects.create(user=self.student, major='Coverage Major')
        self.assertTrue(is_core_module(self.student, self.module))

    def test_build_deleted_notification_content(self):
        from studyFlax.views.modules.module_view import build_module_deleted_notification
        notification = build_module_deleted_notification(self.student, self.module)
        self.assertEqual(notification.user, self.student)
        self.assertEqual(notification.notification_type, 'module_deleted')

    @patch('studyFlax.views.modules.enrollment_logic.logger.debug')
    @patch('studyFlax.views.modules.enrollment_logic.create_enrollment_events')
    def test_safe_create_enrollment_events_catches_operational_error(self, mock_create, mock_debug):
        from django.db import OperationalError
        from studyFlax.views.modules.enrollment_logic import _safe_create_enrollment_events
        mock_create.side_effect = OperationalError('db error')
        _safe_create_enrollment_events(self.student, self.module)
        mock_debug.assert_not_called()

    @patch('studyFlax.views.modules.enrollment_logic._is_running_tests', return_value=False)
    @patch('studyFlax.views.modules.enrollment_logic.create_enrollment_events')
    @patch('studyFlax.views.modules.enrollment_logic.logger.debug')
    def test_safe_create_enrollment_events_logs_in_non_test_context(
        self,
        mock_debug,
        mock_create,
        _mock_is_test,
    ):
        from django.db import OperationalError
        from studyFlax.views.modules.enrollment_logic import _safe_create_enrollment_events

        mock_create.side_effect = OperationalError('db error')
        _safe_create_enrollment_events(self.student, self.module)
        mock_debug.assert_called_once()
