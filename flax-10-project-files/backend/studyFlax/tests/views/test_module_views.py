from rest_framework import status
from django.utils import timezone
from django.test import TestCase
from datetime import timedelta
from ..base import BaseTestCase
from studyFlax.models import Module, User
from studyFlax.serialisers import ModuleSerialiser
from rest_framework.test import APIRequestFactory


class ModuleViewTests(BaseTestCase):

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
        """Test that teacher can successfully create a module. """
        data = dict(module_code='4CCS1DST', module_name='Data Structures',
            start_time=timezone.now().isoformat(),
            end_time=(timezone.now() + timedelta(hours=1)).isoformat())
        response = self.client.post('/api/modules/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_student_cannot_create_module(self):
        """ Test that student creating module fails."""
        self.user.role = 'student'
        self.user.save()
        response = self.client.post('/api/modules/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_modules(self):
        """ Test listing modules."""
        response = self.client.get('/api/modules/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_module(self):
        """ Test get existing modules."""
        response = self.client.get(f'/api/modules/{self.module.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['module_code'], '5CCS2SEG')

    def test_get_nonexistent_module(self):
        """ Test get nonexistent module fails."""
        response = self.client.get('/api/modules/9999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_teacher_can_update_own_module(self):
        """ Test teacher can modify their module."""
        response = self.client.put(f'/api/modules/{self.module.id}/', {'module_name': 'Updated'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['module_name'], 'Updated')

    def test_teacher_can_delete_own_module(self):
        """ Test teacher can delete their module."""
        response = self.client.delete(f'/api/modules/{self.module.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Module.objects.filter(id=self.module.id).exists())

    def test_duplicate_module_code_fails(self):
        """ Test that module_code field is unique."""
        data = dict(module_code='5CCS2SEG', module_name='Duplicate',
            start_time=timezone.now().isoformat(),
            end_time=(timezone.now() + timedelta(hours=1)).isoformat())
        response = self.client.post('/api/modules/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ModuleSerialiserTests(TestCase):
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
        module = Module(
            module_code='8PH302',
            module_name='History of Philosophy',
            created_by=None,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )
        serializer = ModuleSerialiser(module)
        self.assertEqual(serializer.data['created_by_name'], 'Unknown')
