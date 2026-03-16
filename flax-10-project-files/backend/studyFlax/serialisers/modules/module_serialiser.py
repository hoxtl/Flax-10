"""
Serialiser for modules including deadlines and readings.
"""

from rest_framework import serializers
from studyFlax.models import Module
from studyFlax.serialisers.common import ensure_teacher_user, format_teacher_name, build_profile_photo_url
from studyFlax.serialisers.calendar.deadline_serialisers import DeadlineSummarySerialiser
from studyFlax.serialisers.modules.reading_serialisers import ReadingSummarySerialiser

class ModuleSerialiser(serializers.ModelSerializer):
    is_recurring = serializers.BooleanField(write_only=True, required=False, default=True)
    deadlines = DeadlineSummarySerialiser(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    created_by_email = serializers.SerializerMethodField()
    created_by_profile_photo_url = serializers.SerializerMethodField()
    readings = ReadingSummarySerialiser(many=True, read_only=True)

    class Meta:
        model = Module
        fields = ['id', 'module_code', 'module_name', 'description', 'department',
                  'course', 'created_by', 'created_by_name', 'start_time', 'end_time',
                  'location', 'recurrence_rule', 'is_recurring', 'deadlines', 'created_by_email',
                  'created_by_profile_photo_url', 'readings']
        read_only_fields = ['created_by']

    def validate(self, validated_data):
        request = self.context.get('request')
        ensure_teacher_user(request, "Only teachers are allowed to create modules")
        return validated_data

    def create(self, validated_data):
        """Create a module, attaching a weekly recurrence rule if requested."""
        is_recurring = validated_data.pop('is_recurring', True)
        if is_recurring:
            from studyFlax.models import RecurrenceRule
            rule = RecurrenceRule.objects.create(frequency='weekly', interval=1)
            validated_data['recurrence_rule'] = rule
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def get_created_by_name(self, obj):
        try:
            return format_teacher_name(obj.created_by)
        except Exception:
            return 'Unknown'

    def get_created_by_email(self, obj):
        try:
            return obj.created_by.email if obj.created_by else None
        except Exception:
            return None

    def get_created_by_profile_photo_url(self, obj):
        try:
            if not obj.created_by:
                return None
            return build_profile_photo_url(obj.created_by.profile_photo, self.context.get('request'))
        except Exception:
            return None
