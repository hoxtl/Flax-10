"""
Backend tests for module views.
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APIRequestFactory

from ..base import BaseTestCase
from studyFlax.models import Enrollment, Module, Notification, User
from studyFlax.serialisers import ModuleSerialiser

class ModuleViewTests(BaseTestCase):

    """Tests for module view."""

    def setUp(self):
        super().setUp()
        self.user.role = 'teacher'
        self.user.save()
        self.module = Module.objects.create(
            module_code='5CCS2SEG', module_name='Software Engineering',
            created_by=self.user,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )

    def test_teacher_can_create_module(self):
        data = dict(module_code='4CCS1DST', module_name='Data Structures',
            start_time=timezone.now().isoformat(),
            end_time=(timezone.now() + timedelta(hours=1)).isoformat())
        response = self.client.post('/api/modules/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_student_cannot_create_module(self):
        self.user.role = 'student'
        self.user.save()
        response = self.client.post('/api/modules/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_modules(self):
        response = self.client.get('/api/modules/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_module(self):
        response = self.client.get(f'/api/modules/{self.module.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['module_code'], '5CCS2SEG')

    def test_get_nonexistent_module(self):
        response = self.client.get('/api/modules/9999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_teacher_can_update_own_module(self):
        response = self.client.put(f'/api/modules/{self.module.id}/', {'module_name': 'Updated'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['module_name'], 'Updated')

    def test_teacher_can_delete_own_module(self):
        response = self.client.delete(f'/api/modules/{self.module.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Module.objects.filter(id=self.module.id).exists())

    def test_teacher_delete_unenrols_students_and_notifies_them(self):
        student = User.objects.create_user(
            username='module_student',
            email='module_student@example.com',
            password='pass',
        )
        student.role = 'student'
        student.save()
        Enrollment.objects.create(student=student, module=self.module)

        response = self.client.delete(f'/api/modules/{self.module.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Enrollment.objects.filter(student=student, module=self.module).exists())
        notification = Notification.objects.get(user=student, notification_type='module_deleted')
        self.assertIn('unenrolled', notification.message.lower())
        self.assertEqual(notification.action_url, '/modules')

    def test_teacher_update_notifies_enrolled_students_about_changes(self):
        student = User.objects.create_user(
            username='updated_student',
            email='updated_student@example.com',
            password='pass',
        )
        student.role = 'student'
        student.save()
        Enrollment.objects.create(student=student, module=self.module)

        response = self.client.put(
            f'/api/modules/{self.module.id}/',
            {'module_name': 'Updated module title'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification = Notification.objects.get(user=student, notification_type='module_updated')
        self.assertIn('module name', notification.message.lower())
        self.assertEqual(notification.action_url, f'/modules?code={self.module.module_code}')

    def test_teacher_cannot_update_module_with_duplicate_code(self):
        Module.objects.create(
            module_code='TAKEN001', module_name='Taken',
            created_by=self.user,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )
        response = self.client.put(
            f'/api/modules/{self.module.id}/',
            {'module_code': 'TAKEN001', 'module_name': 'Updated'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_module_code_fails(self):
        data = dict(module_code='5CCS2SEG', module_name='Duplicate',
            start_time=timezone.now().isoformat(),
            end_time=(timezone.now() + timedelta(hours=1)).isoformat())
        response = self.client.post('/api/modules/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class ModuleSerialiserTests(TestCase):
    """Tests for module serialiser."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.teacher = User.objects.create_user(
            username='serial_teacher',
            email='serial_teacher@example.com',
            password='pass',
            first_name='Teach',
            last_name='Er'
        )
        self.teacher.role = 'teacher'
        self.teacher.save()
        self.student = User.objects.create_user(
            username='serial_student',
            email='serial_student@example.com',
            password='pass',
            first_name='Stu',
            last_name='Dent'
        )

    def create_module_payload(self):
        start_time = timezone.now()
        end_time = start_time + timedelta(hours=1)
        return {
            'module_code': '8PH300',
            'module_name': 'Philosophy',
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
        }

    def test_teacher_must_create_modules(self):
        request = self.factory.get('/')
        request.user = self.student
        serializer = ModuleSerialiser(data=self.create_module_payload(), context={'request': request})
        self.assertFalse(serializer.is_valid())
        self.assertTrue(serializer.errors)

    def test_is_recurring_true_creates_rule(self):
        request = self.factory.get('/')
        request.user = self.teacher
        serializer = ModuleSerialiser(data=self.create_module_payload(), context={'request': request})
        self.assertTrue(serializer.is_valid())
        module = serializer.save()
        self.assertIsNotNone(module.recurrence_rule)

    def test_is_recurring_false_skips_rule(self):
        request = self.factory.get('/')
        request.user = self.teacher
        payload = self.create_module_payload()
        payload['module_code'] = '8PH301'
        payload['is_recurring'] = False
        serializer = ModuleSerialiser(data=payload, context={'request': request})
        self.assertTrue(serializer.is_valid())
        module = serializer.save()
        self.assertIsNone(module.recurrence_rule)

    def test_created_by_name_unknown_without_owner(self):
        serializer = ModuleSerialiser()

        class FakeModule:
            @property
            def created_by(self):
                raise Exception("RelatedObjectDoesNotExist")

        result = serializer.get_created_by_name(FakeModule())
        self.assertEqual(result, 'Unknown')

    def test_created_by_email_none_on_exception(self):
        serializer = ModuleSerialiser()

        class FakeModule:
            @property
            def created_by(self):
                raise Exception("RelatedObjectDoesNotExist")

        result = serializer.get_created_by_email(FakeModule())
        self.assertIsNone(result)

class ModuleViewCoverageTest(TestCase):
    """Tests for module view branches not yet covered."""

    def setUp(self):
        self.client = APIClient()
        self.teacher = User.objects.create_user(
            username='mv_teacher', email='mv_teacher@test.com', password='pass'
        )
        self.teacher.role = 'teacher'
        self.teacher.save()
        self.student = User.objects.create_user(
            username='mv_student', email='mv_student@test.com', password='pass'
        )
        self.module = Module.objects.create(
            module_code='MV001', module_name='Module View Test',
            created_by=self.teacher,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )

    def test_student_gets_all_modules(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/modules/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_module_permission_denied_for_non_owner(self):
        other_teacher = User.objects.create_user(
            username='mv_other', email='mv_other@test.com', password='pass'
        )
        other_teacher.role = 'teacher'
        other_teacher.save()
        self.client.force_authenticate(user=other_teacher)
        response = self.client.put(f'/api/modules/{self.module.id}/', {'module_name': 'Hacked'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_module_permission_denied_for_non_owner(self):
        other_teacher = User.objects.create_user(
            username='mv_del', email='mv_del@test.com', password='pass'
        )
        other_teacher.role = 'teacher'
        other_teacher.save()
        self.client.force_authenticate(user=other_teacher)
        response = self.client.delete(f'/api/modules/{self.module.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
