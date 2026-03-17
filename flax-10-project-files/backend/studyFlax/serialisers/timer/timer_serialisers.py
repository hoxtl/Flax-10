"""
Serialiser for study session timer records.
"""

from rest_framework import serializers
from studyFlax.models.timer.sessionModel import StudySession

class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = [
            'id', 'start_time', 'end_time', 'duration',
            'pause_duration', 'break_duration', 'session_count',
            'study_block_id', 'task', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user']

    def create(self, validated_data):
        # Automatically associate with the current user
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)
