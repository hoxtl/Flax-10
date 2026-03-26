"""
Tests for registration endpoint.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.authentication.user_settings_model import UserSettings
from studyFlax.views.user.settings_view import DEFAULT_HOMEPAGE_WIDGETS

User = get_user_model()


class RegisterViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/register/'
        self.valid_data = {
            'username': 'newuser', 'password': 'newpass123', 'password2': 'newpass123',
            'email': 'new@example.com', 'first_name': 'New', 'last_name': 'User',
        }

    def test_register_success(self):
        response = self.client.post(self.url, self.valid_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)

    def test_register_invalid_data(self):
        response = self.client.post(self.url, {'username': '', 'password': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_username(self):
        User.objects.create_user(username='newuser', email='other@example.com', password='pass')
        response = self.client.post(self.url, self.valid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RegisterViewCoverageTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/register/'

    def test_register_returns_token_and_user(self):
        data = {
            'username': 'regcov', 'email': 'regcov@example.com',
            'password': 'securepass1', 'password2': 'securepass1',
            'first_name': 'Reg', 'last_name': 'Cov',
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)

    def test_register_creates_user_settings(self):
        data = {
            'username': 'regset', 'email': 'regset@example.com',
            'password': 'securepass1', 'password2': 'securepass1',
            'first_name': 'Reg', 'last_name': 'Set',
        }
        self.client.post(self.url, data)
        user = User.objects.get(username='regset')
        settings = UserSettings.objects.get(user=user)
        self.assertEqual(settings.homepage_widgets, DEFAULT_HOMEPAGE_WIDGETS)
        self.assertEqual(settings.homepage_widget_sizes, {})

    def test_register_invalid_data_returns_400(self):
        response = self.client.post(self.url, {'username': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
