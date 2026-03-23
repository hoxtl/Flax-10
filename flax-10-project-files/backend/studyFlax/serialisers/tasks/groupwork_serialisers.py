"""
Serialisers for group projects and group memberships.
"""

from django.conf import settings
from rest_framework import serializers
from studyFlax.models.groupwork.groupwork_model import (
    GroupProject,
    GroupMembership,
)
from studyFlax.serialisers.common import build_profile_photo_url, format_teacher_display_name

class GroupProjectSerialiser(serializers.ModelSerializer):
    course_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    member_count = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True, default=0)
    completed_task_count = serializers.IntegerField(read_only=True, default=0)
    module_name = serializers.CharField(read_only=True, required=False)
    module_tutor_id = serializers.IntegerField(read_only=True, required=False)
    module_tutor_name = serializers.SerializerMethodField()
    module_tutor_username = serializers.CharField(read_only=True, required=False)
    module_tutor_email = serializers.CharField(read_only=True, required=False)
    module_tutor_profile_photo_url = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()

    class Meta:
        model = GroupProject
        fields = [
            "id",
            "name",
            "course_code",
            "module_name",
            "module_tutor_id",
            "module_tutor_name",
            "module_tutor_username",
            "module_tutor_email",
            "module_tutor_profile_photo_url",
            "deadline",
            "member_count",
            "task_count",
            "completed_task_count",
            "members",
            "created_at",
        ]

    def get_module_tutor_name(self, obj):
        return format_teacher_display_name(getattr(obj, "module_tutor_name", None))

    def get_module_tutor_profile_photo_url(self, obj):
        photo = getattr(obj, "module_tutor_profile_photo", None)
        if not photo:
            return None
        if hasattr(photo, "url"):
            return build_profile_photo_url(photo, self.context.get("request"))
        photo_path = str(photo).strip()
        if not photo_path:
            return None
        if photo_path.startswith(("http://", "https://")):
            return photo_path
        relative_url = photo_path if photo_path.startswith("/") else f"{settings.MEDIA_URL.rstrip('/')}/{photo_path.lstrip('/')}"
        request = self.context.get("request")
        return request.build_absolute_uri(relative_url) if request else relative_url

    def get_members(self, obj):
        return GroupMembershipSerialiser(
            obj.memberships.all(),
            many=True,
            context=self.context,
        ).data


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
