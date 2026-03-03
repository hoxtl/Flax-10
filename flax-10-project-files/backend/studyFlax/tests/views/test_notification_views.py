import json
from rest_framework import status
from ..base import BaseTestCase
from studyFlax.models import Notification

class NotificationViewTests(BaseTestCase):
    """Tests for notification views."""

    def setUp(self):
        """Set up test environment."""
        super().setUp()
        self.list_url = "/api/notifications/"
        self.mark_read_url = "/api/notifications/mark-all-read/"
        self.n1 = Notification.objects.create(user=self.user, title="N1", message="M1")
        self.n2 = Notification.objects.create(user=self.user, title="N2", message="M2")

    def test_list_notifications(self):
        """Test listing notifications."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_create_notification(self):
        """Test creating a notification."""
        data = {"title": "New", "message": "Message"}
        response = self.client.post(self.list_url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Notification.objects.count(), 3)

    def test_create_notification_invalid(self):
        """Test creating invalid notification."""
        response = self.client.post(self.list_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_notification(self):
        """Test deleting a notification."""
        url = f"/api/notifications/{self.n1.id}/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notification.objects.filter(id=self.n1.id).exists())

    def test_delete_notification_not_found(self):
        """Test deleting non-existent notification."""
        url = "/api/notifications/999/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_read(self):
        """Test marking all notifications as read."""
        response = self.client.post(self.mark_read_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(Notification.objects.filter(read=True).count() == 2)
