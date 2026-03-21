"""
Serialiser for user notifications.
"""

from rest_framework import serializers
from studyFlax.models import Notification

class NotificationSerialiser(serializers.ModelSerializer):
    """Serialiser for notification."""
    class Meta:
        """Metadata for notification serialiser."""
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'society_id', 'action_url', 'scroll_to_id', 'read', 'created_at']
