from rest_framework import serializers
from studyFlax.models.society import (
    Society, SocietyMembership, SocietyTag, SocietyImage,
    SocietyAnnouncement, SocietyAnnouncementImage, SocietyEvent
)


class SocietyTagSerialiser(serializers.ModelSerializer):
    class Meta:
        model = SocietyTag
        fields = ['id', 'label', 'color']


class SocietyImageSerialiser(serializers.ModelSerializer):
    class Meta:
        model = SocietyImage
        fields = ['id', 'url', 'is_cover']


class SocietyAnnouncementImageSerialiser(serializers.ModelSerializer):
    class Meta:
        model = SocietyAnnouncementImage
        fields = ['id', 'url', 'order']


class SocietyMembershipSerialiser(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = SocietyMembership
        fields = ['id', 'user', 'username', 'role', 'joined_at', 'is_admin']


class SocietyListSerialiser(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = Society
        fields = ['id', 'name', 'image', 'cover_image', 'is_ratified', 'member_count']

    def get_cover_image(self, obj):
        if obj.image:
            return obj.image
        first_img = obj.images.first()
        return first_img.url if first_img else None


class SocietyAnnouncementSerialiser(serializers.ModelSerializer):
    images = SocietyAnnouncementImageSerialiser(many=True, read_only=True)
    tag_data = SocietyTagSerialiser(source='tag', read_only=True)

    class Meta:
        model = SocietyAnnouncement
        fields = [
            'id', 'title', 'content', 'tag', 'tag_data',
            'pinned', 'images', 'created_at', 'updated_at'
        ]


class SocietyEventSerialiser(serializers.ModelSerializer):
    tag_data = SocietyTagSerialiser(source='tag', read_only=True)

    class Meta:
        model = SocietyEvent
        fields = [
            'id', 'title', 'description', 'location', 'start_time', 'end_time',
            'all_day', 'tag', 'tag_data', 'recurrence', 'announcement', 'created_at'
        ]


class SocietyDetailSerialiser(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    tags = SocietyTagSerialiser(many=True, read_only=True)
    images = SocietyImageSerialiser(many=True, read_only=True)
    announcements = SocietyAnnouncementSerialiser(many=True, read_only=True)
    events = SocietyEventSerialiser(many=True, read_only=True)

    class Meta:
        model = Society
        fields = [
            'id', 'name', 'bio', 'about', 'image', 'is_ratified',
            'date_created', 'member_count', 'tags', 'images', 'announcements', 'events'
        ]
