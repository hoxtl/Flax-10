"""
Tests for admin and user teacher request workflows.
"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.tests.helpers.factories import make_user, make_superuser, authed_client


class AdminTeacherRequestsTest(TestCase):
    def setUp(self):
        self.admin = make_superuser()
        self.list_url = '/api/admin/teacher-requests/'

    def _make_pending(self, username):
        u = make_user(username)
        u.role = 'pending_teacher'
        u.save()
        return u

    def test_list_returns_only_pending_teacher_users(self):
        self._make_pending('pending1')
        make_user('student1')
        data = authed_client(self.admin).get(self.list_url).data
        roles = [u['role'] for u in data]
        self.assertTrue(all(r == 'pending_teacher' for r in roles))
        self.assertEqual(len(roles), 1)

    def test_approve_grants_teacher_role(self):
        pending = self._make_pending('pending2')
        url = f'/api/admin/teacher-requests/{pending.id}/resolve/'
        authed_client(self.admin).post(url, {'decision': 'approve'}, format='json')
        pending.refresh_from_db()
        self.assertEqual(pending.role, 'teacher')

    def test_reject_sets_student_role(self):
        pending = self._make_pending('pending3')
        url = f'/api/admin/teacher-requests/{pending.id}/resolve/'
        authed_client(self.admin).post(url, {'decision': 'reject'}, format='json')
        pending.refresh_from_db()
        self.assertEqual(pending.role, 'student')

    def test_resolve_invalid_decision_returns_400(self):
        pending = self._make_pending('pending4')
        url = f'/api/admin/teacher-requests/{pending.id}/resolve/'
        response = authed_client(self.admin).post(url, {'decision': 'maybe'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resolve_non_pending_user_returns_404(self):
        regular = make_user('regular_user')
        url = f'/api/admin/teacher-requests/{regular.id}/resolve/'
        response = authed_client(self.admin).post(url, {'decision': 'approve'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_admin_cannot_list(self):
        regular = make_user('norole')
        response = authed_client(regular).get(self.list_url)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])


class RequestTeacherRoleTest(TestCase):
    def setUp(self):
        self.url = '/api/request-teacher-role/'

    def test_student_can_request_teacher_role(self):
        user = make_user('requester')
        user.role = 'student'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.role, 'pending_teacher')

    def test_teacher_cannot_request_again(self):
        user = make_user('teacher_user')
        user.role = 'teacher'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pending_teacher_cannot_request_again(self):
        user = make_user('pending_user')
        user.role = 'pending_teacher'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_request_returns_401(self):
        response = APIClient().post(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
