"""
Serialisers for societies, memberships, announcements, events and tags.
"""

from rest_framework import serializers
from studyFlax.models.society import (
    Society, SocietyMembership, SocietyTag, SocietyImage,
    SocietyAnnouncement, SocietyAnnouncementImage, SocietyEvent
)
from studyFlax.serialisers.common import build_profile_photo_url


class HasReportedMixin:
    """Adds a get_has_reported method for society serialisers."""

    def get_has_reported(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.reports.filter(reporter=request.user).exists()
        return False

class SilentNotificationMixin:
    """Skips notifications on create/update when context has skip_notification."""

    def create(self, validated_data):
        instance = self.Meta.model(**validated_data)
        if self.context.get('skip_notification'):
            instance._skip_notification = True
        instance.save()
        return instance

    def update(self, instance, validated_data):
        if self.context.get('skip_notification'):
            instance._skip_notification = True
        return super().update(instance, validated_data)

class SocietyTagSerialiser(serializers.ModelSerializer):
    """Serialiser for society tag."""

    class Meta:
        """Metadata for society tag serialiser."""

        model = SocietyTag
        fields = ['id', 'label', 'color']

class SocietyImageSerialiser(serializers.ModelSerializer):
    """Serialiser for society image."""

    class Meta:
        """Metadata for society image serialiser."""

        model = SocietyImage
        fields = ['id', 'url', 'is_cover']

class SocietyAnnouncementImageSerialiser(serializers.ModelSerializer):
    """Serialiser for society announcement image."""

    class Meta:
        """Metadata for society announcement image serialiser."""

        model = SocietyAnnouncementImage
        fields = ['id', 'url', 'order']

class SocietyMembershipSerialiser(serializers.ModelSerializer):
    """Serialiser for society membership."""

    username = serializers.CharField(source='user.username', read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        """Metadata for society membership serialiser."""

        model = SocietyMembership
        fields = ['id', 'user', 'username', 'role', 'joined_at', 'is_admin', 'is_subscribed', 'profile_photo_url']

    def get_profile_photo_url(self, obj):
        return build_profile_photo_url(obj.user.profile_photo, self.context.get('request'))

class SocietyListSerialiser(HasReportedMixin, serializers.ModelSerializer):
    """Serialiser for society list."""

    member_count = serializers.IntegerField(read_only=True)
    cover_image = serializers.SerializerMethodField()
    has_reported = serializers.SerializerMethodField()

    class Meta:
        """Metadata for society list serialiser."""

        model = Society
        fields = ['id', 'name', 'bio', 'location', 'image', 'cover_image', 'categories', 'is_ratified', 'member_count', 'admin_emails', 'has_reported']

    def get_cover_image(self, obj):
        if obj.image:
            return obj.image
        first_img = obj.images.first()
        return first_img.url if first_img else None

class SocietyAnnouncementSerialiser(SilentNotificationMixin, serializers.ModelSerializer):
    """Serialiser for society announcement."""

    images = SocietyAnnouncementImageSerialiser(many=True, read_only=True)
    tag_data = SocietyTagSerialiser(source='tag', read_only=True)
    event_id = serializers.SerializerMethodField()

    def get_event_id(self, obj):
        event = obj.events.first()
        return event.id if event else None

    class Meta:
        """Metadata for society announcement serialiser."""

        model = SocietyAnnouncement
        fields = [
            'id', 'title', 'content', 'tag', 'tag_data',
            'pinned', 'images', 'created_at', 'updated_at', 'event_id'
        ]

class SocietyEventSerialiser(SilentNotificationMixin, serializers.ModelSerializer):
    """Serialiser for society event."""

    tag_data = SocietyTagSerialiser(source='tag', read_only=True)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.announcement:
            representation['title'] = f"📢 {instance.title}"
        return representation

    class Meta:
        """Metadata for society event serialiser."""

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
        """Metadata for society event calendar serialiser."""

        model = SocietyEvent
        fields = [
            'id', 'title', 'description', 'location', 'start_time', 'end_time',
            'society', 'society_name', 'society_color', 'source', 'announcement', 'exception_dates'
        ]

    def get_society_color(self, obj):
        """Return society colour."""
        return get_society_color(obj.society_id)

    def get_source(self, obj):
        return 'society'

SOCIETY_COLORS = [
    '#F4A7B9',  # dusty rose
    '#B8C8F4',  # periwinkle
    '#A8D8B0',  # mint
    '#F9C89A',  # peach
    '#C5B4E3',  # lavender
    '#96CEFF',  # sky blue
    '#F7D090',  # butter
    '#B0D9A8',  # sage
    '#F2C6D0',  # blush
    '#9FD3D3',  # seafoam
]

def get_society_color(society_id):
    """Return society colour."""
    return SOCIETY_COLORS[society_id % len(SOCIETY_COLORS)]

class SocietyDetailSerialiser(HasReportedMixin, serializers.ModelSerializer):
    """Serialiser for society detail."""

    member_count = serializers.IntegerField(read_only=True)
    tags = SocietyTagSerialiser(many=True, read_only=True)
    images = SocietyImageSerialiser(many=True, read_only=True)
    announcements = SocietyAnnouncementSerialiser(many=True, read_only=True)
    events = SocietyEventSerialiser(many=True, read_only=True)
    has_reported = serializers.SerializerMethodField()

    class Meta:
        """Metadata for society detail serialiser."""

        model = Society
        fields = [
            'id', 'name', 'bio', 'about', 'location', 'image', 'categories', 'is_ratified', 'ratification_status',
            'date_created', 'member_count', 'tags', 'images', 'announcements', 'events', 'admin_emails', 'has_reported'
        ]
