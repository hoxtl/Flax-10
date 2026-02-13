from rest_framework import serializers
from studyFlax.models.auth.userSettingsModel import UserSettings


class UserSettingsSerialiser(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ['theme', 'timezone', 'year', 'major']