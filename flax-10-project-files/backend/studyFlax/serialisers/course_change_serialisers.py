from rest_framework import serializers
from studyFlax.models.auth.courseChangeRequestModel import CourseChangeRequest


class CourseChangeRequestSerialiser(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = CourseChangeRequest
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'requested_course',
            'current_course',
            'status',
            'created_at',
            'resolved_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'resolved_at']
