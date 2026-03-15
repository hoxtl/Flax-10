from rest_framework import serializers
from studyFlax.models import EventAttendance


class RecordAttendanceSerialiser(serializers.Serializer):
    event_id = serializers.IntegerField()
    attended = serializers.BooleanField(default=True)
