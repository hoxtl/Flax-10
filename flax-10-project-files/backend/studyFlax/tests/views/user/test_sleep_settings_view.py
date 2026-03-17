"""
Backend tests for sleep settings views.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class SleepSettingsViewTest(TestCase):

    """Tests for sleep settings view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='testpass123',
        )
        self.client.force_authenticate(user=self.user)
        self.url = '/api/settings/'

    def get_sleep(self, response):
        """Extract sleep_time from either flat or nested response."""
        if 'settings' in response.data:
            return response.data['settings']['sleep_time']
        return response.data['sleep_time']

    def get_wake(self, response):
        """Return wake for tests."""
        if 'settings' in response.data:
            return response.data['settings']['wake_time']
        return response.data['wake_time']

    def test_settings_include_sleep_fields(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('sleep_time', response.data)
        self.assertIn('wake_time', response.data)

    def test_default_sleep_times(self):
        response = self.client.get(self.url)
        self.assertTrue(response.data['sleep_time'].startswith('23:00'))
        self.assertTrue(response.data['wake_time'].startswith('07:00'))

    def test_update_sleep_times(self):
        response = self.client.patch(self.url, {'sleep_time': '22:30', 'wake_time': '06:30'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(self.get_sleep(response).startswith('22:30'))
        self.assertTrue(self.get_wake(response).startswith('06:30'))

    def test_sleep_time_persisted_after_update(self):
        self.client.patch(self.url, {'sleep_time': '00:00', 'wake_time': '08:00'}, format='json')
        response = self.client.get(self.url)
        self.assertTrue(response.data['sleep_time'].startswith('00:00'))
        self.assertTrue(response.data['wake_time'].startswith('08:00'))

    def test_unauthenticated_access_denied(self):
        response = APIClient().get(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_other_users_cannot_see_my_sleep_times(self):
        other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        self.client.patch(self.url, {'sleep_time': '01:00'}, format='json')
        other_client = APIClient()
        other_client.force_authenticate(user=other)
        response = other_client.get(self.url)
        self.assertFalse(response.data['sleep_time'].startswith('01:00'))
