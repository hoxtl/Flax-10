"""
Tests for admin user listing and ban management.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.tests.helpers.test_model_builders import make_user, make_superuser, authed_client


User = get_user_model()


class AdminUserListTest(TestCase):
    """Tests admin user list."""

    def setUp(self):
        self.admin = make_superuser()
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


class AdminBanUserTest(TestCase):
    """Tests admin ban user."""

    def setUp(self):
        self.admin = make_superuser()
        self.target = make_user('target')
        self.url = f'/api/admin/users/{self.target.id}/ban/'

    def test_ban_sets_user_inactive(self):
        authed_client(self.admin).post(self.url, {'action': 'ban', 'reason': 'Spam'}, format='json')
        self.target.refresh_from_db()
        self.assertFalse(self.target.is_active)

    def test_ban_stores_reason(self):
        authed_client(self.admin).post(self.url, {'action': 'ban', 'reason': 'Spam'}, format='json')
        self.target.refresh_from_db()
        self.assertEqual(self.target.ban_reason, 'Spam')

    def test_ban_returns_200(self):
        response = authed_client(self.admin).post(self.url, {'action': 'ban', 'reason': 'Spam'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ban_requires_reason(self):
        response = authed_client(self.admin).post(self.url, {'action': 'ban', 'reason': '   '}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.target.refresh_from_db()
        self.assertTrue(self.target.is_active)

    def test_unban_restores_active(self):
        self.target.is_active = False
        self.target.ban_reason = 'Old reason'
        self.target.save()
        authed_client(self.admin).post(self.url, {'action': 'unban'}, format='json')
        self.target.refresh_from_db()
        self.assertTrue(self.target.is_active)

    def test_unban_clears_reason(self):
        self.target.is_active = False
        self.target.ban_reason = 'Old reason'
        self.target.save()
        authed_client(self.admin).post(self.url, {'action': 'unban'}, format='json')
        self.target.refresh_from_db()
        self.assertEqual(self.target.ban_reason, '')

    def test_cannot_ban_staff_user(self):
        staff = User.objects.create_user(
            username='staff2', email='staff2@example.com', password='pass', is_staff=True,
        )
        url = f'/api/admin/users/{staff.id}/ban/'
        response = authed_client(self.admin).post(url, {'action': 'ban', 'reason': 'Spam'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_ban_protected_fixture_user(self):
        protected = make_user('janedoe')
        url = f'/api/admin/users/{protected.id}/ban/'
        response = authed_client(self.admin).post(url, {'action': 'ban', 'reason': 'Spam'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        protected.refresh_from_db()
        self.assertTrue(protected.is_active)

    def test_fixture_protection_is_case_insensitive(self):
        protected = make_user('Charlie')
        url = f'/api/admin/users/{protected.id}/ban/'
        response = authed_client(self.admin).post(url, {'action': 'ban', 'reason': 'Spam'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_protected_fixture_user_can_still_be_unbanned(self):
        protected = make_user('amiller')
        protected.is_active = False
        protected.ban_reason = 'Old reason'
        protected.save()
        url = f'/api/admin/users/{protected.id}/ban/'
        response = authed_client(self.admin).post(url, {'action': 'unban'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        protected.refresh_from_db()
        self.assertTrue(protected.is_active)
        self.assertEqual(protected.ban_reason, '')

    def test_ban_nonexistent_user_returns_404(self):
        url = '/api/admin/users/999999/ban/'
        response = authed_client(self.admin).post(url, {'action': 'ban'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_action_returns_400(self):
        response = authed_client(self.admin).post(self.url, {'action': 'delete'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_cannot_ban(self):
        regular = make_user('reg2')
        response = authed_client(regular).post(self.url, {'action': 'ban', 'reason': ''}, format='json')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
