from rest_framework import serializers
from studyFlax.models import Notification


class NotificationSerialiser(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'read', 'created_at']
