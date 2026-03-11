from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token

from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyReportModel import SocietyReport

User = get_user_model()


def make_admin(username='admin', password='adminpass'):
    return User.objects.create_superuser(
        username=username, email=f'{username}@example.com', password=password,
        is_staff=True, is_superuser=True,
    )


def make_user(username='user', password='userpass', role='student', is_active=True):
    return User.objects.create_user(
        username=username, email=f'{username}@example.com',
        password=password, is_active=is_active,
    )


def authed_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client

class AdminUserListTest(TestCase):
    def setUp(self):
        self.admin = make_admin()
        self.url = '/api/admin/users/'

    def test_admin_can_list_users(self):
        response = authed_client(self.admin).get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_response_includes_user_fields(self):
        make_user('alice')
        data = authed_client(self.admin).get(self.url).data
        usernames = [u['username'] for u in data]
        self.assertIn('alice', usernames)

    def test_non_admin_is_forbidden(self):
        regular = make_user('reg')
        response = authed_client(regular).get(self.url)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_unauthenticated_is_forbidden(self):
        response = APIClient().get(self.url)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_response_includes_is_active_and_ban_reason(self):
        make_user('bob')
        data = authed_client(self.admin).get(self.url).data
        bob = next(u for u in data if u['username'] == 'bob')
        self.assertIn('is_active', bob)
        self.assertIn('ban_reason', bob)