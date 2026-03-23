"""
Serialisers for calendar sharing between users.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from studyFlax.models.social.share_model import CalendarShare
from studyFlax.serialisers.common import build_profile_photo_url, is_shared_with_requester, is_user_sharing_with

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
        return is_user_sharing_with(obj, self.context.get("request"))

    def get_is_shared_with_me(self, obj):
        return is_shared_with_requester(obj, self.context.get("request"))

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
