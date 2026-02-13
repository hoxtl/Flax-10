from rest_framework import serializers
from studyFlax.models import Module
from studyFlax.models import User

class ModuleSerialiser(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.first_name', read_only=True)
    class Meta:
        model = Module
        fields = ['id', 'module_code', 'module_name', 'description', 'created_by', 'created_by_name', 'start_time', 'end_time', 'location', 'recurrence_rule']
    
    def validate(self, validated_data):
        user = self.context['request'].user
        if user and not user.is_teacher():
            raise serializers.ValidationError("Only teachers are allowed to create modules")
        return validated_data

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
