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

    class Meta:
        model = GroupMembership
        fields = [
            "id",
            "user",
            "user_name",
            "role",
            "joined_at",
        ]

