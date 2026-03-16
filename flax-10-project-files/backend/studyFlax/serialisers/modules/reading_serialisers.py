"""
Serialisers for module readings with page count and duration estimates.
"""

from rest_framework import serializers
from studyFlax.models import Reading
from studyFlax.utils.reading_utils import estimated_time_reading

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

    def validate(self, validated_data):
        if not self.context['request'].user.is_teacher():
            raise serializers.ValidationError("Only teachers are allowed to manage readings.")
        start = validated_data.get('start_page')
        end = validated_data.get('end_page')
        if start is not None and end is not None and end < start:
            raise serializers.ValidationError("End page must be after start page")
        return validated_data

    def validate_chapter(self, value):
        if value and value.strip().startswith('-'):
            raise serializers.ValidationError("Chapter cannot be negative.")
        return value

    def get_page_count(self, obj):
        return obj.page_count()
    
    def get_duration_minutes(self, obj):
        return estimated_time_reading(obj, self.context['request'].user)

class ReadingSummarySerialiser(serializers.ModelSerializer):
    page_count = serializers.SerializerMethodField()

    class Meta:
        model = Reading
        fields = ['id', 'title', 'chapter', 'start_page', 'end_page', 'page_count', 'deadline']

    def get_page_count(self, obj):
        return obj.page_count()