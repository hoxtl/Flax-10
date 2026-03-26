"""
Tests for home-address endpoint.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


User = get_user_model()


class HomeAddressViewCoverageTest(TestCase):
    """Tests home address view coverage."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='hacov', email='hacov@example.com', password='pass')
        self.client.force_authenticate(user=self.user)
        self.url = '/api/user/home-address/'

    def test_invalid_coordinates_returns_400(self):
        response = self.client.post(self.url, {
            'home_address': '123 Main St',
            'home_latitude': 'not_a_number',
            'home_longitude': '1.0',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_save_returns_200(self):
        response = self.client.post(self.url, {
            'home_address': '123 Main St',
            'home_latitude': '51.5',
            'home_longitude': '-0.1',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
