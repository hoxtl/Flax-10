"""
Serialisers for user settings and preferences.
"""

from rest_framework import serializers
from studyFlax.models.auth.userSettingsModel import UserSettings

class UserSettingsSerialiser(serializers.ModelSerializer):
    """Serialiser for user application settings."""

    major_locked = serializers.SerializerMethodField(read_only=True)

    def get_major_locked(self, obj):
        return bool(obj.major)

    def validate_major(self, value):
        """Prevent changing the major once it has been set."""
        if self.instance and self.instance.major and value != self.instance.major:
            raise serializers.ValidationError("major cannot be changed once set")
        return value

    class Meta:
        model = UserSettings
        fields = ['theme', 'timezone', 'year', 'major', 'sleep_time', 'wake_time', 'major_locked']
