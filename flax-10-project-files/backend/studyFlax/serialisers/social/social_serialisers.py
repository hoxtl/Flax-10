"""
Serialisers for calendar sharing between users.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from studyFlax.models.social.shareModel import CalendarShare
from studyFlax.serialisers.common import build_profile_photo_url

User = get_user_model()

class CalendarShareUserSerialiser(serializers.ModelSerializer):
    """Serialiser for displaying simple user info in calendar share lists."""

    is_sharing = serializers.SerializerMethodField()
    is_shared_with_me = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "is_sharing",
            "is_shared_with_me",
            "profile_photo_url",
        )

    def get_profile_photo_url(self, obj):
        return build_profile_photo_url(obj.profile_photo, self.context.get("request"))

    def get_is_sharing(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return request.user.sharing_with.filter(shared_with=obj).exists()
        return False

    def get_is_shared_with_me(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.sharing_with.filter(shared_with=request.user).exists()
        return False

class CalendarShareSerialiser(serializers.ModelSerializer):
    """Serialiser purely representing the CalendarShare relationship."""

    class Meta:
        model = CalendarShare
        fields = ("id", "owner", "shared_with", "created_at")
        read_only_fields = ("owner",)

    def validate(self, data):
        """Ensure a user cannot share with themselves."""
        request = self.context.get("request")
        if request and request.user == data.get("shared_with"):
            raise serializers.ValidationError("You cannot share your calendar with yourself.")
        return data

    def create(self, validated_data):
        """Automatically set the owner to the current user."""
        request = self.context.get("request")
        validated_data["owner"] = request.user
        return super().create(validated_data)
