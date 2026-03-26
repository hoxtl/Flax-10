"""
Serialisers for course change requests.
"""

from rest_framework import serializers
from studyFlax.models.auth.course_change_request_model import CourseChangeRequest


class CourseChangeRequestSerialiser(serializers.ModelSerializer):
    """Serialiser for course change request."""
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        """Metadata for course change request serialiser."""
        model = CourseChangeRequest
        fields = [
            'id',
            'user_id',
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
