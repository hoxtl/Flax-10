from django.test import TestCase
from studyFlax.models import Notification

class NotificationModelTest(TestCase):
    """Test suite for Notification model."""

    def setUp(self):
        """Set up test data."""
        self.notification_data = {
            "title": "Test Notification",
            "message": "This is a test message."
        }
        self.notification = self.create_notification(self.notification_data)

    def create_notification(self, data):
        """Helper to create a notification."""
        return Notification.objects.create(**data)

    def test_notification_creation(self):
        """Test that a notification can be created."""
        self.assertTrue(isinstance(self.notification, Notification))
        self.assertEqual(self.notification.__str__(), self.notification_data["title"])

    def test_notification_fields(self):
        """Test notification fields are saved correctly."""
        self.assertEqual(self.notification.title, self.notification_data["title"])
        self.assertEqual(self.notification.message, self.notification_data["message"])
        self.assertFalse(self.notification.read)
        self.assertIsNotNone(self.notification.created_at)

    def test_notification_str_method(self):
        """Test the string representation of the notification."""
        self.assertEqual(str(self.notification), self.notification_data["title"])
