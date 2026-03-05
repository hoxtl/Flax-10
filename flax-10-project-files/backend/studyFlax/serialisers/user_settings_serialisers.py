from rest_framework import serializers
from studyFlax.models.auth.userSettingsModel import UserSettings


class UserSettingsSerialiser(serializers.ModelSerializer):
    major_locked = serializers.SerializerMethodField()

    class Meta:
        model = UserSettings
        fields = ['theme', 'timezone', 'year', 'major', 'major_locked', 'sleep_time', 'wake_time']

    def get_major_locked(self, obj):
        return bool(obj.major)

    def validate_major(self, value):
        if self.instance and self.instance.major:
            raise serializers.ValidationError(
                "Your course cannot be changed once set during onboarding."
            )
        return value