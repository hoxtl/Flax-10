from rest_framework import serializers
from studyFlax.models import Deadline
from django.utils.dateparse import parse_datetime

class DeadlineSerialiser(serializers.ModelSerializer):
    module_code = serializers.CharField(source='module.module_code', read_only=True)
    module_name = serializers.CharField(source='module.module_name', read_only=True)  # add this
    end_due_date = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = Deadline
        fields = ['id', 'module', 'module_code', 'module_name', 'title', 'deadline_type',  # add module_name here
                  'description', 'start_due_date', 'end_due_date', 'location']
        read_only_fields = ['module']

    def validate(self, validated_data):
        user = self.context['request'].user
        if  not user.is_teacher():
            raise serializers.ValidationError("Only teachers are allowed to manage modules")
        start = validated_data.get('start_due_date')
        end = validated_data.get('end_due_date')
        if start and end and end <= start:
            raise serializers.ValidationError("End time must be after start time")
        return validated_data

class DeadlineSummarySerialiser(serializers.ModelSerializer):
    class Meta:
        model = Deadline
        fields = ['id', 'title', 'deadline_type', 'start_due_date']
