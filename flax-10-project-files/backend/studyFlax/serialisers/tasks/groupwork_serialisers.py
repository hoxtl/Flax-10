"""
Serialisers for group projects and group memberships.
"""

<<<<<<< HEAD
from django.conf import settings
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
from rest_framework import serializers
from studyFlax.models.groupwork.groupwork_model import (
    GroupProject,
    GroupMembership,
)
<<<<<<< HEAD
from studyFlax.serialisers.common import build_profile_photo_url, format_teacher_display_name


def build_module_tutor_photo_url(photo, request):
    photo_path = cleaned_photo_path(photo)
    if photo_path is None:
        return None
    if hasattr(photo_path, "url"):
        return build_profile_photo_url(photo, request)
    if photo_path.startswith(("http://", "https://")):
        return photo_path
    return absolute_photo_url(photo_path, request)

def cleaned_photo_path(photo):
    if not photo:
        return None
    if hasattr(photo, "url"):
        return photo
    photo_path = str(photo).strip()
    return photo_path or None

def absolute_photo_url(photo_path, request):
    relative_url = photo_path if photo_path.startswith("/") else f"{settings.MEDIA_URL.rstrip('/')}/{photo_path.lstrip('/')}"
    return request.build_absolute_uri(relative_url) if request else relative_url

class GroupProjectSerialiser(serializers.ModelSerializer):
    """Serialiser for group project."""
    course_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
=======
from studyFlax.serialisers.common import build_profile_photo_url

class GroupProjectSerialiser(serializers.ModelSerializer):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    member_count = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True, default=0)
    completed_task_count = serializers.IntegerField(read_only=True, default=0)
    module_name = serializers.CharField(read_only=True, required=False)
<<<<<<< HEAD
    module_tutor_id = serializers.IntegerField(read_only=True, required=False)
    module_tutor_name = serializers.SerializerMethodField()
    module_tutor_username = serializers.CharField(read_only=True, required=False)
    module_tutor_email = serializers.CharField(read_only=True, required=False)
    module_tutor_profile_photo_url = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()

    class Meta:
        """Metadata for group project serialiser."""
=======
    members = serializers.SerializerMethodField()

    class Meta:
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        model = GroupProject
        fields = [
            "id",
            "name",
            "course_code",
            "module_name",
<<<<<<< HEAD
            "module_tutor_id",
            "module_tutor_name",
            "module_tutor_username",
            "module_tutor_email",
            "module_tutor_profile_photo_url",
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
            "deadline",
            "member_count",
            "task_count",
            "completed_task_count",
            "members",
            "created_at",
        ]

<<<<<<< HEAD
    def get_module_tutor_name(self, obj):
        return format_teacher_display_name(getattr(obj, "module_tutor_name", None))

    def get_module_tutor_profile_photo_url(self, obj):
        photo = getattr(obj, "module_tutor_profile_photo", None)
        return build_module_tutor_photo_url(photo, self.context.get("request"))

    def get_members(self, obj):
        return GroupMembershipSerialiser(
            obj.memberships.all(),
            many=True,
            context=self.context,
        ).data


class GroupMembershipSerialiser(serializers.ModelSerializer):
    """Serialiser for group membership."""
=======
    def get_members(self, obj):
        return GroupMembershipSerialiser(obj.memberships.all(), many=True).data


class GroupMembershipSerialiser(serializers.ModelSerializer):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    user_name = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
<<<<<<< HEAD
        """Metadata for group membership serialiser."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
