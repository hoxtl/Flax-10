"""
Serialiser for modules including deadlines and readings.
"""

from rest_framework import serializers
from studyFlax.models import Module
from studyFlax.serialisers.common import ensure_teacher_user, format_teacher_name
from studyFlax.serialisers.calendar.deadline_serialisers import DeadlineSummarySerialiser
from studyFlax.serialisers.modules.reading_serialisers import ReadingSummarySerialiser


def _created_by(obj):
    try:
        return getattr(obj, "created_by", None)
    except Exception:
        return None

def _created_by_email(obj):
    return getattr(_created_by(obj), "email", None)

def _created_by_username(obj):
    return getattr(_created_by(obj), "username", None)

def _created_by_profile_photo(obj):
    return getattr(_created_by(obj), "profile_photo", None)

def _profile_photo_url(photo, request):
    if not photo:
        return None
    return request.build_absolute_uri(photo.url) if request else photo.url


class ModuleSerialiser(serializers.ModelSerializer):
    """Serialiser for module."""
    is_recurring = serializers.BooleanField(write_only=True, required=False, default=True)
    deadlines = DeadlineSummarySerialiser(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    created_by_email = serializers.SerializerMethodField()
    created_by_profile_photo_url = serializers.SerializerMethodField()
    created_by_username = serializers.SerializerMethodField()
    readings = ReadingSummarySerialiser(many=True, read_only=True)

    class Meta:
        """Metadata for module serialiser."""
        model = Module
        fields = ['id', 'module_code', 'module_name', 'description', 'department',
                  'course', 'created_by', 'created_by_name', 'start_time', 'end_time',
                  'location', 'recurrence_rule', 'is_recurring', 'deadlines', 'created_by_email',
                  'created_by_profile_photo_url', 'created_by_username', 'readings']
        read_only_fields = ['created_by']

    def _validate(self, validated_data):
        request = self.context.get('request')
        ensure_teacher_user(request, "Only teachers are allowed to create modules")
        return validated_data

    def _create(self, validated_data):
        """Create a module, attaching a weekly recurrence rule if requested."""
        is_recurring = validated_data.pop('is_recurring', True)
        if is_recurring:
            from studyFlax.models import RecurrenceRule
            rule = RecurrenceRule.objects.create(frequency='weekly', interval=1)
            validated_data['recurrence_rule'] = rule
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def _get_created_by_name(self, obj):
        try:
            return format_teacher_name(obj.created_by)
        except Exception:
            return 'Unknown'

    def _get_created_by_email(self, obj):
        return _created_by_email(obj)

    def _get_created_by_profile_photo_url(self, obj):
        return _profile_photo_url(_created_by_profile_photo(obj), self.context.get("request"))

    def _get_created_by_username(self, obj):
        return _created_by_username(obj)


ModuleSerialiser.validate = ModuleSerialiser._validate
ModuleSerialiser.create = ModuleSerialiser._create
ModuleSerialiser.get_created_by_name = ModuleSerialiser._get_created_by_name
ModuleSerialiser.get_created_by_email = ModuleSerialiser._get_created_by_email
ModuleSerialiser.get_created_by_profile_photo_url = ModuleSerialiser._get_created_by_profile_photo_url
ModuleSerialiser.get_created_by_username = ModuleSerialiser._get_created_by_username
