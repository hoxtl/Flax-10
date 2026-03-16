from rest_framework import serializers
from studyFlax.models import Notification

class NotificationSerialiser(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'society_id', 'action_url', 'scroll_to_id', 'read', 'created_at']
