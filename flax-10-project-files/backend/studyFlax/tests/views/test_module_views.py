from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from ..base import BaseTestCase
from studyFlax.models import Module, User


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
