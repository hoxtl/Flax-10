from rest_framework import serializers
from studyFlax.models import Enrollment

class EnrollmentSerialiser(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    module_name = serializers.CharField(source='module.module_name', read_only=True)
    module_code = serializers.CharField(source='module.module_code', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'student_name', 'module', 'module_name', 'module_code', 'enrolled_at']
        read_only_fields = ['student']

    def validate(self, validated_data):
        user = self.context['request'].user
        module = validated_data.get('module')
        if user.is_teacher():
            raise serializers.ValidationError("Teachers cannot enroll in modules")
        
        if Enrollment.objects.filter(student=user, module=module).exists():
            raise serializers.ValidationError("You are already enrolled in this module.")
        return validated_data
