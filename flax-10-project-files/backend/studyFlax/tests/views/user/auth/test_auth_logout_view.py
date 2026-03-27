"""
Tests for authentication logout endpoints.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient


User = get_user_model()


class LogoutViewTest(TestCase):
    """Tests logout view."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        Token.objects.create(user=self.user)
        self.client.force_authenticate(user=self.user)
        self.url = '/api/auth/logout/'

    def test_logout_unauthenticated(self):
        response = APIClient().post(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class LogoutViewCoverageTest(TestCase):
    """Tests logout view coverage."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/logout/'

    def test_logout_deletes_token(self):
        user = User.objects.create_user(username='logcov', email='logcov@example.com', password='pass')
        Token.objects.create(user=user)
        self.client.force_authenticate(user=user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(user=user).exists())

    def test_logout_no_token_still_200(self):
        user = User.objects.create_user(username='lognotok', email='lognotok@example.com', password='pass')
        self.client.force_authenticate(user=user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
