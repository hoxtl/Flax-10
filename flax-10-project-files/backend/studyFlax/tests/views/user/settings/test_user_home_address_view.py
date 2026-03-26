"""
Backend tests for user home-address endpoint.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


User = get_user_model()


class UserHomeAddressViewTest(TestCase):
    """Tests for /api/user/home-address/."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_get_home_address(self):
        response = self.client.get('/api/user/home-address/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('home_address', response.data)

    def test_post_home_address(self):
        response = self.client.post('/api/user/home-address/', {
            'home_address': '10 Downing St',
            'home_latitude': 51.5,
            'home_longitude': -0.1,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

    def test_post_home_address_empty(self):
        response = self.client.post('/api/user/home-address/', {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
