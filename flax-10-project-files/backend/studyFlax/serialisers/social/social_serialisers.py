"""
Serialisers for calendar sharing between users.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from studyFlax.models.social.share_model import CalendarShare
from studyFlax.serialisers.common import build_profile_photo_url, is_shared_with_requester, is_user_sharing_with

<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
User = get_user_model()

class CalendarShareUserSerialiser(serializers.ModelSerializer):
    """Serialiser for displaying simple user info in calendar share lists."""

    is_sharing = serializers.SerializerMethodField()
    is_shared_with_me = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
<<<<<<< HEAD
        """Metadata for calendar share user serialiser."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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

<<<<<<< HEAD
    def _get_profile_photo_url(self, obj):
        return build_profile_photo_url(obj.profile_photo, self.context.get("request"))

    def _get_is_sharing(self, obj):
        return is_user_sharing_with(obj, self.context.get("request"))

    def _get_is_shared_with_me(self, obj):
=======
    def get_profile_photo_url(self, obj):
        return build_profile_photo_url(obj.profile_photo, self.context.get("request"))

    def get_is_sharing(self, obj):
        return is_user_sharing_with(obj, self.context.get("request"))

    def get_is_shared_with_me(self, obj):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        return is_shared_with_requester(obj, self.context.get("request"))

class CalendarShareSerialiser(serializers.ModelSerializer):
    """Serialiser purely representing the CalendarShare relationship."""

    class Meta:
<<<<<<< HEAD
        """Metadata for calendar share serialiser."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        model = CalendarShare
        fields = ("id", "owner", "shared_with", "created_at")
        read_only_fields = ("owner",)

<<<<<<< HEAD
    def _validate(self, data):
=======
    def validate(self, data):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        """Ensure a user cannot share with themselves."""
        request = self.context.get("request")
        if request and request.user == data.get("shared_with"):
            raise serializers.ValidationError("You cannot share your calendar with yourself.")
        return data

<<<<<<< HEAD
    def _create(self, validated_data):
=======
    def create(self, validated_data):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        """Automatically set the owner to the current user."""
        request = self.context.get("request")
        validated_data["owner"] = request.user
        return super().create(validated_data)
<<<<<<< HEAD


CalendarShareUserSerialiser.get_profile_photo_url = CalendarShareUserSerialiser._get_profile_photo_url
CalendarShareUserSerialiser.get_is_sharing = CalendarShareUserSerialiser._get_is_sharing
CalendarShareUserSerialiser.get_is_shared_with_me = CalendarShareUserSerialiser._get_is_shared_with_me
CalendarShareSerialiser.validate = CalendarShareSerialiser._validate
CalendarShareSerialiser.create = CalendarShareSerialiser._create
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
