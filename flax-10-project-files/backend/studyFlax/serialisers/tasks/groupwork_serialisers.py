"""
Serialisers for group projects and group memberships.
"""

from rest_framework import serializers
from studyFlax.models.groupwork.groupwork_model import (
    GroupProject,
    GroupMembership,
)
from studyFlax.serialisers.common import build_profile_photo_url

class GroupProjectSerialiser(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True, default=0)
    completed_task_count = serializers.IntegerField(read_only=True, default=0)
    module_name = serializers.CharField(read_only=True, required=False)
    members = serializers.SerializerMethodField()

    class Meta:
        model = GroupProject
        fields = [
            "id",
            "name",
            "course_code",
            "module_name",
            "deadline",
            "member_count",
            "task_count",
            "completed_task_count",
            "members",
            "created_at",
        ]

    def get_members(self, obj):
        return GroupMembershipSerialiser(obj.memberships.all(), many=True).data


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
