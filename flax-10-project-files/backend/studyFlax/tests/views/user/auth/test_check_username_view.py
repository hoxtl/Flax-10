"""
Backend tests for check username endpoint.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


User = get_user_model()


class CheckUsernameViewTest(TestCase):
    """Tests for /api/check-username/."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_username_available(self):
        response = self.client.post('/api/check-username/', {'username': 'brandnew'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['available'])

    def test_username_taken(self):
        User.objects.create_user(username='taken', email='taken@example.com', password='pass')
        response = self.client.post('/api/check-username/', {'username': 'taken'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['available'])

    def test_username_empty(self):
        response = self.client.post('/api/check-username/', {'username': ''})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['available'])

    def test_username_too_short(self):
        response = self.client.post('/api/check-username/', {'username': 'ab'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['available'])

    def test_own_username_available(self):
        response = self.client.post('/api/check-username/', {'username': 'testuser'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['available'])
