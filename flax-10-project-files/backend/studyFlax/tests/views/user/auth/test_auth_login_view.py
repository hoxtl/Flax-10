"""
Tests for authentication login endpoints.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient


User = get_user_model()


class LoginViewTest(TestCase):
    """Tests login view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        self.url = '/api/auth/login/'

    def test_login_success(self):
        response = self.client.post(self.url, {'username': 'testuser', 'password': 'testpass123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_invalid_credentials(self):
        response = self.client.post(self.url, {'username': 'testuser', 'password': 'wrongpass'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_invalid_data(self):
        response = self.client.post(self.url, {'username': '', 'password': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_existing_token_reused(self):
        Token.objects.create(user=self.user)
        response = self.client.post(self.url, {'username': 'testuser', 'password': 'testpass123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class LoginNonExistentUserTest(TestCase):
    """Tests login non existent user."""
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/login/'

    def test_login_nonexistent_username_returns_401(self):
        response = self.client.post(self.url, {'username': 'doesnotexist', 'password': 'somepass123'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LoginBannedUserTest(TestCase):
    """Tests login banned user."""
    def setUp(self):
        self.url = '/api/auth/login/'
        self.user = User.objects.create_user(
            username='banneduser', email='banned@example.com', password='pass', is_active=False,
        )
        self.user.set_password('pass')
        self.user.ban_reason = 'Violated community guidelines'
        self.user.save()

    def test_banned_user_gets_403(self):
        response = APIClient().post(self.url, {'username': 'banneduser', 'password': 'pass'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_banned_response_contains_is_banned_true(self):
        response = APIClient().post(self.url, {'username': 'banneduser', 'password': 'pass'})
        self.assertTrue(response.data.get('is_banned'))

    def test_banned_response_contains_correct_ban_reason(self):
        response = APIClient().post(self.url, {'username': 'banneduser', 'password': 'pass'})
        self.assertEqual(response.data.get('ban_reason'), 'Violated community guidelines')
