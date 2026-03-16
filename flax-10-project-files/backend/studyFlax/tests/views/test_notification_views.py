"""
Backend tests for notification views.
"""

import json

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIRequestFactory

from ..base import BaseTestCase
from studyFlax.models import Notification

User = get_user_model()

class NotificationViewTests(BaseTestCase):
    """Tests for notification views."""

    def setUp(self):
        super().setUp()
        self.list_url = "/api/notifications/"
        self.mark_read_url = "/api/notifications/mark-all-read/"
        self.n1 = Notification.objects.create(user=self.user, title="N1", message="M1")
        self.n2 = Notification.objects.create(user=self.user, title="N2", message="M2")

    def test_list_notifications(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_create_notification(self):
        data = {"title": "New", "message": "Message"}
        response = self.client.post(self.list_url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Notification.objects.count(), 3)

    def test_create_notification_invalid(self):
        response = self.client.post(self.list_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_notification(self):
        url = f"/api/notifications/{self.n1.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(id=self.n1.id).exists())

    def test_delete_notification_not_found(self):
        url = "/api/notifications/999/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_read(self):
        response = self.client.post(self.mark_read_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(Notification.objects.filter(read=True).count() == 2)

    def test_clear_all_notifications(self):
        response = self.client.delete("/api/notifications/clear-all/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 0)


class NotificationAndProfileCoverageTest(TestCase):
    """Tests for notification and profile helper branches."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(username='profile_cov', email='profile_cov@example.com', password='pass')

    def test_get_notifications_returns_ordered_data(self):
        from studyFlax.views.notifications.notification_views import get_notifications
        Notification.objects.create(user=self.user, title='First', message='1')
        Notification.objects.create(user=self.user, title='Second', message='2')
        request = self.factory.get('/')
        request.user = self.user
        response = get_notifications(request)
        self.assertEqual(len(response.data), 2)

    def test_profile_build_response_includes_zero_defaults(self):
        from studyFlax.views.user.profile_view import build_profile_response
        request = self.factory.get('/')
        request.user = self.user
        data = build_profile_response(self.user, request)
        self.assertEqual(data['task_count'], 0)
        self.assertEqual(data['module_count'], 0)
