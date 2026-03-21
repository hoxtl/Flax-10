<<<<<<< HEAD
"""
Tests for course change views.
"""
=======
"""Backend tests for course change request views."""
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from studyFlax.models.auth.course_change_request_model import CourseChangeRequest
from studyFlax.models.auth.user_settings_model import UserSettings
<<<<<<< HEAD
from studyFlax.tests.helpers.test_model_builders import make_user, make_superuser, authed_client


class RequestCourseChangeTest(TestCase):
    """Tests request course change."""
=======
from studyFlax.tests.helpers.factories import make_user, make_superuser, authed_client

class RequestCourseChangeTest(TestCase):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    def setUp(self):
        self.user = make_user()
        self.url = '/api/course-change/request/'

    def test_unauthenticated_is_rejected(self):
        response = APIClient().post(self.url, {'requested_course': 'Physics'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_creates_request(self):
        response = authed_client(self.user).post(
            self.url, {'requested_course': 'Physics'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['requested_course'], 'Physics')
        self.assertEqual(response.data['status'], 'pending')

    def test_missing_requested_course_returns_400(self):
        response = authed_client(self.user).post(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_same_course_returns_400(self):
        settings_obj, _ = UserSettings.objects.get_or_create(user=self.user)
        settings_obj.major = 'Physics'
        settings_obj.save()
        response = authed_client(self.user).post(
            self.url, {'requested_course': 'Physics'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_pending_returns_400(self):
        CourseChangeRequest.objects.create(
            user=self.user,
            requested_course='Chemistry',
            current_course='Physics',
        )
        response = authed_client(self.user).post(
            self.url, {'requested_course': 'Biology'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class MyCourseChangeRequestTest(TestCase):
<<<<<<< HEAD
    """Tests my course change request."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    def setUp(self):
        self.user = make_user()
        self.url = '/api/course-change/my-request/'

    def test_returns_none_when_no_request(self):
        response = authed_client(self.user).get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data)

    def test_returns_most_recent_request(self):
        CourseChangeRequest.objects.create(
            user=self.user,
            requested_course='Biology',
            current_course='Physics',
        )
        response = authed_client(self.user).get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['requested_course'], 'Biology')

    def test_unauthenticated_is_rejected(self):
        response = APIClient().get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class ListCourseChangeRequestsTest(TestCase):
<<<<<<< HEAD
    """Tests list course change requests."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    def setUp(self):
        self.admin = make_superuser()
        self.user = make_user()
        self.url = '/api/admin/course-change-requests/'

    def test_non_admin_is_rejected(self):
        response = authed_client(self.user).get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_pending_requests(self):
        CourseChangeRequest.objects.create(
            user=self.user,
            requested_course='Biology',
            current_course='Physics',
        )
        response = authed_client(self.admin).get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_only_pending_are_returned(self):
        CourseChangeRequest.objects.create(
            user=self.user,
            requested_course='Biology',
            current_course='Physics',
            status='approved',
        )
        response = authed_client(self.admin).get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

class ResolveCourseChangeRequestTest(TestCase):
<<<<<<< HEAD
    """Tests resolve course change request."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    def setUp(self):
        self.admin = make_superuser()
        self.user = make_user()
        self.req = CourseChangeRequest.objects.create(
            user=self.user,
            requested_course='Biology',
            current_course='Physics',
        )
        self.url = f'/api/admin/course-change-requests/{self.req.id}/resolve/'

    def test_non_admin_is_rejected(self):
        response = authed_client(self.user).post(
            self.url, {'decision': 'approve'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_decision_returns_400(self):
        response = authed_client(self.admin).post(
            self.url, {'decision': 'dunno'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approve_updates_user_settings(self):
        response = authed_client(self.admin).post(
            self.url, {'decision': 'approve'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'approved')
        settings_obj = UserSettings.objects.get(user=self.user)
        self.assertEqual(settings_obj.major, 'Biology')

    def test_reject_does_not_update_user_settings(self):
        UserSettings.objects.get_or_create(user=self.user, defaults={'major': 'Physics'})
        response = authed_client(self.admin).post(
            self.url, {'decision': 'reject'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'rejected')
        settings_obj = UserSettings.objects.get(user=self.user)
        self.assertEqual(settings_obj.major, 'Physics')

    def test_not_found_returns_404(self):
        response = authed_client(self.admin).post(
            '/api/admin/course-change-requests/99999/resolve/',
            {'decision': 'approve'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
