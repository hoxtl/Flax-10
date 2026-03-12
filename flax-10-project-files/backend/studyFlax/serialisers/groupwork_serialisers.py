from rest_framework import serializers

from studyFlax.models.groupwork.groupwork_models import (
    GroupProject,
    GroupMembership,
)


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
        request = self.context.get("request")
        photo = obj.user.profile_photo
        if photo and request:
            return request.build_absolute_uri(photo.url)
        if photo:
            return photo.url
        return None

