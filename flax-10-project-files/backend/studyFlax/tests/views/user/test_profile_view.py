"""
Backend tests for profile view endpoints.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.modules.enrollmentModel import Enrollment
from studyFlax.models.modules.moduleModel import Module
from studyFlax.models.calendar.calendarEventModel import CalendarEvent

User = get_user_model()


class ProfileViewTest(TestCase):
    """Tests for /api/profile/ and /api/users/<id>/profile/."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='pass',
            first_name='Test', last_name='User'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('username', response.data)

    def test_get_profile_with_events(self):
        CalendarEvent.objects.create(
            user=self.user,
            title='Test',
            start_time=timezone.now() + timezone.timedelta(hours=1),
            end_time=timezone.now() + timezone.timedelta(hours=2),
        )
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('event_count', response.data)

    def test_patch_profile_username(self):
        response = self.client.patch('/api/profile/', {'username': 'newusername'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_same_username(self):
        response = self.client.patch('/api/profile/', {'username': 'testuser'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_taken_username(self):
        User.objects.create_user(username='taken', email='taken@example.com', password='pass')
        response = self.client.patch('/api/profile/', {'username': 'taken'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_profile_bio(self):
        response = self.client.patch('/api/profile/', {'bio': 'Hello world'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_weekly_goal(self):
        response = self.client.patch('/api/profile/', {'weekly_goal_hours': '10'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_remove_photo(self):
        response = self.client.patch('/api/profile/', {'remove_photo': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_another_user_profile(self):
        other = User.objects.create_user(
            username='other', email='other@example.com', password='pass'
        )
        response = self.client.get(f'/api/users/{other.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_another_user_profile_not_found(self):
        response = self.client.get('/api/users/99999/profile/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_teacher_profile_returns_only_taught_modules(self):
        teacher = self._make_teacher('teacher1', 'teacher1@example.com', 'Teach', 'Er')
        other_teacher = self._make_teacher('teacher2', 'teacher2@example.com', 'Other', 'Teach')
        taught = self._make_module('CS9001', 'Teaching Module', teacher)
        self._make_module('CS9002', 'Not Mine', other_teacher)
        Enrollment.objects.create(student=teacher, module=taught)
        response = self.client.get(f'/api/users/{teacher.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['modules'], ['CS9001'])
        self.assertEqual(response.data['module_count'], 1)

    def test_profile_prefers_taught_modules_when_role_is_stale(self):
        creator = User.objects.create_user(
            username='creator1', email='creator1@example.com',
            password='pass', first_name='Create', last_name='Or', role='student',
        )
        self._make_module('CS9010', 'Creator Module', creator)
        response = self.client.get(f'/api/users/{creator.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['modules'], ['CS9010'])
        self.assertEqual(response.data['module_count'], 1)

    def test_unauthenticated(self):
        response = APIClient().get('/api/profile/')
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def _make_teacher(self, username, email, first_name, last_name):
        return User.objects.create_user(
            username=username, email=email, password='pass',
            first_name=first_name, last_name=last_name, role='teacher',
        )

    def _make_module(self, code, name, created_by):
        return Module.objects.create(
            module_code=code, module_name=name, created_by=created_by,
            start_time=timezone.now(), end_time=timezone.now() + timezone.timedelta(hours=2),
        )


class ProfileViewCoverageTest(TestCase):
    """Tests for the profile photo branch."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='pv_user', email='pv_user@test.com', password='pass',
            first_name='PV', last_name='User'
        )
        self.client.force_authenticate(user=self.user)

    def test_patch_remove_photo(self):
        response = self.client.patch('/api/profile/', data={'remove_photo': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
