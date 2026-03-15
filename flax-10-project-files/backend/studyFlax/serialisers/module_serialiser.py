from rest_framework import serializers
from studyFlax.models import Module
from studyFlax.models import User
from studyFlax.serialisers.deadline_serialisers import DeadlineSummarySerialiser

class ModuleSerialiser(serializers.ModelSerializer):
    is_recurring = serializers.BooleanField(write_only=True, required=False, default=True)
    deadlines = DeadlineSummarySerialiser(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    created_by_email = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = ['id', 'module_code', 'module_name', 'description', 'department',
                'course', 'created_by', 'created_by_name', 'start_time', 'end_time',
                'location', 'recurrence_rule', 'is_recurring', 'deadlines', 'created_by_email']
        read_only_fields = ['created_by']
        
    def validate(self, validated_data):
        user = self.context['request'].user
        if user and not user.is_teacher():
            raise serializers.ValidationError("Only teachers are allowed to create modules")
        return validated_data

    def create(self, validated_data):
        is_recurring = validated_data.pop('is_recurring', True)
        if is_recurring:
            from studyFlax.models import RecurrenceRule
            rule = RecurrenceRule.objects.create(frequency='weekly',interval=1)
            validated_data['recurrence_rule'] = rule
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def get_created_by_name(self, obj):
        try:
            if obj.created_by:
                return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        except Exception:
            pass
        return 'Unknown'

    def get_created_by_email(self, obj):
        try:
            return obj.created_by.email if obj.created_by else None
        except Exception:
            return None
    
