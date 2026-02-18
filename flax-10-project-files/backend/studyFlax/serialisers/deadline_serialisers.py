from rest_framework import serializers
from studyFlax.models import Deadline

class DeadlineSerialiser(serializers.ModelSerializer):
    module_code = serializers.CharField(source='module.module_code', read_only=True)

    class Meta:
        model = Deadline
        fields = ['id', 'module', 'module_code', 'title', 'deadline_type', 'description', 'start_due_date', 'end_due_date', 'location']
        read_only_fields = ['module']

    def validate(self, validated_data):
        user = self.context['request'].user
        if  not user.is_teacher():
            raise serializers.ValidationError("Only teachers are allowed to manage modules")
        return validated_data

    def validate_end_due_date(self, value):
        start = self.initial_data.get('start_due_date')
        if value and start:
            if value <= start:
                raise serializers.ValidationError("End time must be after start time.")
        return value


