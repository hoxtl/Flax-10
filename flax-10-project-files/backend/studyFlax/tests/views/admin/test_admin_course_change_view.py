"""
Tests for admin course change request views and user course change requests.
"""

from unittest.mock import patch

from django.db import DatabaseError
from django.test import TestCase
from rest_framework import status

from studyFlax.models.auth.course_change_request_model import CourseChangeRequest
from studyFlax.models.auth.user_settings_model import UserSettings
from studyFlax.tests.helpers.factories import make_user, make_superuser, authed_client


class CourseChangeRequestTest(TestCase):
    def setUp(self):
        self.admin = make_superuser()
        self.user = make_user('cc_user')
        UserSettings.objects.create(user=self.user, theme='light', timezone='Europe/London', major='Physics')

    def test_submit_course_change_request(self):
        response = authed_client(self.user).post(
            '/api/course-change/request/', {'requested_course': 'Computer Science'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_submit_same_course_returns_400(self):
        response = authed_client(self.user).post(
            '/api/course-change/request/', {'requested_course': 'Physics'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_submit_duplicate_pending_returns_400(self):
        authed_client(self.user).post(
            '/api/course-change/request/', {'requested_course': 'Math'}, format='json',
        )
        response = authed_client(self.user).post(
            '/api/course-change/request/', {'requested_course': 'Chemistry'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_submit_empty_course_returns_400(self):
        response = authed_client(self.user).post(
            '/api/course-change/request/', {'requested_course': ''}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('studyFlax.views.admin.course_change_view.CourseChangeRequest.objects.create')
    def test_submit_database_error_returns_503(self, mock_create):
        mock_create.side_effect = DatabaseError('db down')
        response = authed_client(self.user).post(
            '/api/course-change/request/', {'requested_course': 'Computer Science'}, format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_get_my_request_returns_data(self):
        authed_client(self.user).post(
            '/api/course-change/request/', {'requested_course': 'Math'}, format='json',
        )
        response = authed_client(self.user).get('/api/course-change/my-request/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data)

    def test_get_my_request_returns_null_when_none(self):
        response = authed_client(self.user).get('/api/course-change/my-request/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data)

    def test_delete_pending_request(self):
        authed_client(self.user).post(
            '/api/course-change/request/', {'requested_course': 'Math'}, format='json',
        )
        response = authed_client(self.user).delete('/api/course-change/my-request/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_no_pending_request_returns_404(self):
        response = authed_client(self.user).delete('/api/course-change/my-request/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_resolved_request_returns_404(self):
        CourseChangeRequest.objects.create(
            user=self.user, requested_course='Math',
            current_course='Physics', status='approved',
        )
        response = authed_client(self.user).delete('/api/course-change/my-request/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_list_pending_requests(self):
        CourseChangeRequest.objects.create(
            user=self.user, requested_course='Math', current_course='Physics',
        )
        response = authed_client(self.admin).get('/api/admin/course-change-requests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_approve_request(self):
        req = CourseChangeRequest.objects.create(
            user=self.user, requested_course='Computer Science', current_course='Physics',
        )
        url = f'/api/admin/course-change-requests/{req.pk}/resolve/'
        response = authed_client(self.admin).post(url, {'decision': 'approve'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'approved')

    def test_admin_reject_request(self):
        req = CourseChangeRequest.objects.create(
            user=self.user, requested_course='Computer Science', current_course='Physics',
        )
        url = f'/api/admin/course-change-requests/{req.pk}/resolve/'
        response = authed_client(self.admin).post(url, {'decision': 'reject'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, 'rejected')

    def test_admin_resolve_invalid_decision_returns_400(self):
        req = CourseChangeRequest.objects.create(
            user=self.user, requested_course='Math', current_course='Physics',
        )
        url = f'/api/admin/course-change-requests/{req.pk}/resolve/'
        response = authed_client(self.admin).post(url, {'decision': 'maybe'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_resolve_nonexistent_returns_404(self):
        url = '/api/admin/course-change-requests/999999/resolve/'
        response = authed_client(self.admin).post(url, {'decision': 'approve'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch('studyFlax.views.admin.course_change_view._apply_decision')
    def test_admin_approve_database_error_returns_503(self, mock_apply):
        mock_apply.side_effect = DatabaseError('db down')
        req = CourseChangeRequest.objects.create(
            user=self.user, requested_course='Math', current_course='Physics',
        )
        url = f'/api/admin/course-change-requests/{req.pk}/resolve/'
        response = authed_client(self.admin).post(url, {'decision': 'approve'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    @patch('studyFlax.views.admin.course_change_view._apply_decision')
    def test_admin_reject_database_error_returns_503(self, mock_apply):
        mock_apply.side_effect = DatabaseError('db down')
        req = CourseChangeRequest.objects.create(
            user=self.user, requested_course='Math', current_course='Physics',
        )
        url = f'/api/admin/course-change-requests/{req.pk}/resolve/'
        response = authed_client(self.admin).post(url, {'decision': 'reject'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


class CourseChangeServiceUnitTest(TestCase):
    def setUp(self):
        self.user = make_user('svc_user')

    def test_handle_request_creation_error_raises_unexpected_exception(self):
        from studyFlax.views.admin.course_change_service import handle_request_creation_error
        with self.assertRaises(RuntimeError):
            handle_request_creation_error(RuntimeError('unexpected'))

    def test_pending_request_response_returns_request_when_pending(self):
        from studyFlax.views.admin.course_change_service import pending_request_response
        req = CourseChangeRequest.objects.create(
            user=self.user, requested_course='Math', current_course='Physics',
        )
        self.assertEqual(pending_request_response(req), req)

    def test_pending_request_response_returns_none_for_none(self):
        from studyFlax.views.admin.course_change_service import pending_request_response
        self.assertIsNone(pending_request_response(None))

    def test_pending_request_response_returns_none_for_resolved_request(self):
        from studyFlax.views.admin.course_change_service import pending_request_response
        req = CourseChangeRequest.objects.create(
            user=self.user, requested_course='Math', current_course='Physics', status='approved',
        )
        self.assertIsNone(pending_request_response(req))
