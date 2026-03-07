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
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = SocietyMembership
        fields = ['id', 'user', 'username', 'role', 'joined_at', 'is_admin', 'is_subscribed', 'profile_photo_url']

    def get_profile_photo_url(self, obj):
        if not obj.user.profile_photo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.user.profile_photo.url) if request else None


class SocietyListSerialiser(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    cover_image = serializers.SerializerMethodField()
    has_reported = serializers.SerializerMethodField()

    class Meta:
        model = Society
        fields = ['id', 'name', 'bio', 'image', 'cover_image', 'categories', 'is_ratified', 'member_count', 'admin_emails', 'has_reported']

    def get_cover_image(self, obj):
        if obj.image:
            return obj.image
        first_img = obj.images.first()
        return first_img.url if first_img else None

    def get_has_reported(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.reports.filter(reporter=request.user).exists()
        return False


class SocietyAnnouncementSerialiser(serializers.ModelSerializer):
    images = SocietyAnnouncementImageSerialiser(many=True, read_only=True)
    tag_data = SocietyTagSerialiser(source='tag', read_only=True)
    event_id = serializers.SerializerMethodField()

    def create(self, validated_data):
        instance = SocietyAnnouncement(**validated_data)
        if self.context.get('skip_notification'):
            instance._skip_notification = True
        instance.save()
        return instance

    def update(self, instance, validated_data):
        if self.context.get('skip_notification'):
            instance._skip_notification = True
        return super().update(instance, validated_data)

    def get_event_id(self, obj):
        event = obj.events.first()
        return event.id if event else None

    class Meta:
        model = SocietyAnnouncement
        fields = [
            'id', 'title', 'content', 'tag', 'tag_data',
            'pinned', 'images', 'created_at', 'updated_at', 'event_id'
        ]


class SocietyEventSerialiser(serializers.ModelSerializer):
    tag_data = SocietyTagSerialiser(source='tag', read_only=True)

    def create(self, validated_data):
        instance = SocietyEvent(**validated_data)
        if self.context.get('skip_notification'):
            instance._skip_notification = True
        instance.save()
        return instance

    def update(self, instance, validated_data):
        if self.context.get('skip_notification'):
            instance._skip_notification = True
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.announcement:
            representation['title'] = f"📢 {instance.title}"
        return representation

    class Meta:
        model = SocietyEvent
        fields = [
            'id', 'title', 'description', 'location', 'start_time', 'end_time',
            'all_day', 'tag', 'tag_data', 'recurrence', 'recurrence_end_date',
            'exception_dates', 'announcement', 'created_at'
        ]


class SocietyEventCalendarSerialiser(serializers.ModelSerializer):
    """Serializer for society events displayed in personal calendar."""
    society_name = serializers.CharField(source='society.name', read_only=True)
    society_color = serializers.SerializerMethodField()
    source = serializers.SerializerMethodField()

    class Meta:
        model = SocietyEvent
        fields = [
            'id', 'title', 'description', 'location', 'start_time', 'end_time',
            'society', 'society_name', 'society_color', 'source', 'announcement', 'exception_dates'
        ]

    def get_society_color(self, obj):
        return get_society_color(obj.society_id)

    def get_source(self, obj):
        return 'society'


SOCIETY_COLORS = [
    '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
    '#00BCD4', '#009688', '#4CAF50', '#FF9800', '#FF5722',
]


def get_society_color(society_id):
    return SOCIETY_COLORS[society_id % len(SOCIETY_COLORS)]


class SocietyDetailSerialiser(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    tags = SocietyTagSerialiser(many=True, read_only=True)
    images = SocietyImageSerialiser(many=True, read_only=True)
    announcements = SocietyAnnouncementSerialiser(many=True, read_only=True)
    events = SocietyEventSerialiser(many=True, read_only=True)
    has_reported = serializers.SerializerMethodField()

    class Meta:
        model = Society
        fields = [
            'id', 'name', 'bio', 'about', 'image', 'categories', 'is_ratified', 'ratification_status',
            'date_created', 'member_count', 'tags', 'images', 'announcements', 'events', 'admin_emails', 'has_reported'
        ]

    def get_has_reported(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.reports.filter(reporter=request.user).exists()
        return False
