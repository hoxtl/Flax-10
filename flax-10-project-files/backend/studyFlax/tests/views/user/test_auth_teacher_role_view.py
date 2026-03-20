"""
Tests for teacher role request cancellation flow.
"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.tests.helpers.factories import authed_client, make_user


class CancelTeacherRoleRequestTest(TestCase):
    def setUp(self):
        self.url = '/api/cancel-teacher-role/'

    def test_pending_teacher_can_cancel(self):
        user = make_user('cancel_pending')
        user.role = 'pending_teacher'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.role, 'student')

    def test_student_cannot_cancel(self):
        user = make_user('cancel_student')
        user.role = 'student'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_cannot_cancel(self):
        user = make_user('cancel_teacher')
        user.role = 'teacher'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_cannot_cancel(self):
        response = APIClient().post(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
