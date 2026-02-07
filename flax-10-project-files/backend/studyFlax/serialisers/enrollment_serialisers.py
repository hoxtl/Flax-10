from rest_framework import serializers
from studyFlax.models import Enrollment
from studyFlax.models import User

class EnrollmentSerialiser(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    module_name = serializers.CharField(source='module.module_name', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'student_name', 'module', 'module_name', 'enrolled_at']
    
    def validate(self, validated_data):
        user = self.context['request'].user
        if user.is_teacher:
            raise serializers.ValidationError("Teachers cannot enroll in modules")
        
        if user.id != validated_data.get('student', user).id:
            raise serializers.ValidationError("Students can only enroll themselves.")
        
        return validated_data
    
    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)
    
