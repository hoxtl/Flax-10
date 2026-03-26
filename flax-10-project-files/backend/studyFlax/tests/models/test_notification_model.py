"""
Backend tests for notification model.
"""

from django.test import TestCase
from studyFlax.models import Notification


class NotificationModelTest(TestCase):
    """Test suite for Notification model."""

    def setUp(self):
        self.notification_data = {
            "title": "Test Notification",
            "message": "This is a test message."
        }
        self.notification = self.create_notification(self.notification_data)

    def create_notification(self, data):
        return Notification.objects.create(**data)

    def test_notification_creation(self):
        self.assertTrue(isinstance(self.notification, Notification))
        self.assertEqual(self.notification.__str__(), self.notification_data["title"])

    def test_notification_fields(self):
        self.assertEqual(self.notification.title, self.notification_data["title"])
        self.assertEqual(self.notification.message, self.notification_data["message"])
        self.assertFalse(self.notification.read)
        self.assertIsNotNone(self.notification.created_at)

    def test_notification_str_method(self):
        self.assertEqual(str(self.notification), self.notification_data["title"])
