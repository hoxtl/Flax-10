from rest_framework import serializers
from studyFlax.models.auth.userSettingsModel import UserSettings


class UserSettingsSerialiser(serializers.ModelSerializer):
<<<<<<< HEAD
    major_locked = serializers.SerializerMethodField()

    class Meta:
        model = UserSettings
        fields = ['theme', 'mode', 'timezone', 'year', 'major', 'major_locked', 'sleep_time', 'wake_time', 'homepage_widgets']
=======
    major_locked = serializers.SerializerMethodField(read_only=True)
>>>>>>> origin/main

    def get_major_locked(self, obj):
        return bool(obj.major)

    def validate_major(self, value):
        if self.instance and self.instance.major:
            if value != self.instance.major:
                raise serializers.ValidationError("major cannot be changed once set")
        return value

    class Meta:
        model = UserSettings
        fields = ['theme', 'timezone', 'year', 'major', 'sleep_time', 'wake_time', 'major_locked']
