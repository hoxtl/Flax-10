"""
Backend tests for enrollment model.
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from django.db import IntegrityError
from studyFlax.models.auth.userModel import User
from studyFlax.models.modules.moduleModel import Module
from studyFlax.models.modules.enrollmentModel import Enrollment


class EnrollmentModelTests(TestCase):
    """ Test suite for Enrollment model."""
    def setUp(self):
        self.teacher = User.objects.create_user(
            username='teacher', email='teacher@test.com',
            password='pass', first_name='Teacher', last_name='Test', role='teacher'
        )
        self.student = User.objects.create_user(
            username='student', email='student@test.com',
            password='pass', first_name='Student', last_name='Test', role='student'
        )
        self.module = Module.objects.create(
            module_code='5CCS2SEG', module_name='Software Engineering',
            created_by=self.teacher,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )

    def test_enrollment_creation(self):
        enrollment = Enrollment.objects.create(student=self.student, module=self.module)
        self.assertIsInstance(enrollment, Enrollment)

    def test_duplicate_enrollment_fails(self):
        Enrollment.objects.create(student=self.student, module=self.module)
        with self.assertRaises(IntegrityError):
            Enrollment.objects.create(student=self.student, module=self.module)

    def test_deleted_with_student(self):
        Enrollment.objects.create(student=self.student, module=self.module)
        self.student.delete()
        self.assertEqual(Enrollment.objects.count(), 0)

    def test_deleted_with_module(self):
        Enrollment.objects.create(student=self.student, module=self.module)
        self.module.delete()
        self.assertEqual(Enrollment.objects.count(), 0)

    def test_enrolled_at_auto_set(self):
        enrollment = Enrollment.objects.create(student=self.student, module=self.module)
        self.assertIsNotNone(enrollment.enrolled_at)
