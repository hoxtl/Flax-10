"""
Serialisers for module readings with page count and duration estimates.
"""

from rest_framework import serializers
from studyFlax.models import Reading
from studyFlax.utils.reading_utils import estimated_time_reading


def _page_count(obj):
    return obj.page_count()


def _duration_minutes(obj, request):
    return estimated_time_reading(obj, request.user)


class ReadingSerialiser(serializers.ModelSerializer):
    module_code = serializers.CharField(source='module.module_code', read_only=True)
    module_name = serializers.CharField(source='module.module_name', read_only=True)
    estimated_minutes = serializers.IntegerField(required=False, allow_null=True)
    duration_minutes = serializers.SerializerMethodField()
    page_count = serializers.SerializerMethodField()

    class Meta:
        model = Reading
        fields = [
            'id', 'module_code', 'module_name', 'title',
            'chapter', 'start_page', 'end_page', 'page_count',
            'deadline', 'estimated_minutes', 'duration_minutes', 'created_at'
        ]
        read_only_fields=['module', 'created_at']

    def _validate(self, validated_data):
        if not self.context['request'].user.is_teacher():
            raise serializers.ValidationError("Only teachers are allowed to manage readings.")
        start = validated_data.get('start_page')
        end = validated_data.get('end_page')
        if start is not None and end is not None and end < start:
            raise serializers.ValidationError("End page must be after start page")
        return validated_data

    def _validate_chapter(self, value):
        if value and value.strip().startswith('-'):
            raise serializers.ValidationError("Chapter cannot be negative.")
        return value

    def _get_page_count(self, obj):
        return _page_count(obj)
    
    def _get_duration_minutes(self, obj):
        return _duration_minutes(obj, self.context['request'])

class ReadingSummarySerialiser(serializers.ModelSerializer):
    page_count = serializers.SerializerMethodField()

    class Meta:
        model = Reading
        fields = ['id', 'title', 'chapter', 'start_page', 'end_page', 'page_count', 'deadline']

    def _get_page_count(self, obj):
        return _page_count(obj)


ReadingSerialiser.validate = ReadingSerialiser._validate
ReadingSerialiser.validate_chapter = ReadingSerialiser._validate_chapter
ReadingSerialiser.get_page_count = ReadingSerialiser._get_page_count
ReadingSerialiser.get_duration_minutes = ReadingSerialiser._get_duration_minutes
ReadingSummarySerialiser.get_page_count = ReadingSummarySerialiser._get_page_count
