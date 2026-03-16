from rest_framework import serializers
from studyFlax.models.auth.userSettingsModel import UserSettings


class UserSettingsSerialiser(serializers.ModelSerializer):
    major_locked = serializers.SerializerMethodField(read_only=True)

    def get_major_locked(self, obj):
        return bool(obj.major)

    def validate_major(self, value):
        if self.instance and self.instance.major:
            if value != self.instance.major:
                raise serializers.ValidationError("major cannot be changed once set")
        return value

    class Meta:
        model = UserSettings
        fields = [
            'theme',
            'timezone',
            'year',
            'major',
            'sleep_time',
            'wake_time',
            'preferred_study_minutes_per_day',
            'week_preference',
            'worktime_preference',
            'major_locked']
