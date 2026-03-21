"""
Serialiser for study session timer records.
"""

from rest_framework import serializers
from studyFlax.models.timer.session_model import StudySession
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

class StudySessionSerializer(serializers.ModelSerializer):
    """Serialiser for study session."""
    class Meta:
        """Metadata for study session serialiser."""
        model = StudySession
        fields = [
            'id', 'start_time', 'end_time', 'duration',
            'pause_duration', 'break_duration', 'session_count',
            'study_block_id', 'task', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['user'] = request.user
        return super().create(validated_data)
