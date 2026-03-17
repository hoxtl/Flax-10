"""
Serialisers for group projects and group memberships.
"""

from rest_framework import serializers
from studyFlax.models.groupwork.groupworkModel import (
    GroupProject,
    GroupMembership,
)
from studyFlax.serialisers.common import build_profile_photo_url

class GroupProjectSerialiser(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = GroupProject
        fields = [
            "id",
            "name",
            "course_code",
            "deadline",
            "member_count",
            "created_at",
        ]

class GroupMembershipSerialiser(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = GroupMembership
        fields = [
            "id",
            "user",
            "user_name",
            "first_name",
            "last_name",
            "profile_photo_url",
            "role",
            "joined_at",
        ]

    def get_profile_photo_url(self, obj):
        return build_profile_photo_url(obj.user.profile_photo, self.context.get("request"))
