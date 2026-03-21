"""
Serialiser for modules including deadlines and readings.
"""

from rest_framework import serializers
from studyFlax.models import Module
from studyFlax.serialisers.common import ensure_teacher_user, format_teacher_name
from studyFlax.serialisers.calendar.deadline_serialisers import DeadlineSummarySerialiser
from studyFlax.serialisers.modules.reading_serialisers import ReadingSummarySerialiser


<<<<<<< HEAD
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
=======
class ModuleSerialiser(serializers.ModelSerializer):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    is_recurring = serializers.BooleanField(write_only=True, required=False, default=True)
    deadlines = DeadlineSummarySerialiser(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    created_by_email = serializers.SerializerMethodField()
    created_by_profile_photo_url = serializers.SerializerMethodField()
    created_by_username = serializers.SerializerMethodField()
    readings = ReadingSummarySerialiser(many=True, read_only=True)

    class Meta:
<<<<<<< HEAD
        """Metadata for module serialiser."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        model = Module
        fields = ['id', 'module_code', 'module_name', 'description', 'department',
                  'course', 'created_by', 'created_by_name', 'start_time', 'end_time',
                  'location', 'recurrence_rule', 'is_recurring', 'deadlines', 'created_by_email',
                  'created_by_profile_photo_url', 'created_by_username', 'readings']
        read_only_fields = ['created_by']

<<<<<<< HEAD
    def _validate(self, validated_data):
=======
    def validate(self, validated_data):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        request = self.context.get('request')
        ensure_teacher_user(request, "Only teachers are allowed to create modules")
        return validated_data

<<<<<<< HEAD
    def _create(self, validated_data):
=======
    def create(self, validated_data):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        """Create a module, attaching a weekly recurrence rule if requested."""
        is_recurring = validated_data.pop('is_recurring', True)
        if is_recurring:
            from studyFlax.models import RecurrenceRule
            rule = RecurrenceRule.objects.create(frequency='weekly', interval=1)
            validated_data['recurrence_rule'] = rule
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

<<<<<<< HEAD
    def _get_created_by_name(self, obj):
=======
    def get_created_by_name(self, obj):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        try:
            return format_teacher_name(obj.created_by)
        except Exception:
            return 'Unknown'

<<<<<<< HEAD
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
=======
    def get_created_by_email(self, obj):
        try:
            created_by = obj.created_by
        except Exception:
            return None
        return getattr(created_by, "email", None)

    def get_created_by_profile_photo_url(self, obj):
        created_by = getattr(obj, "created_by", None)
        profile_photo = getattr(created_by, "profile_photo", None)
        if not profile_photo:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(profile_photo.url) if request else profile_photo.url

    def get_created_by_username(self, obj):
        created_by = getattr(obj, "created_by", None)
        return getattr(created_by, "username", None)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
