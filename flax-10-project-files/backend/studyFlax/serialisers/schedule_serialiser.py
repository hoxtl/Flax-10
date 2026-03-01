from rest_framework import serializers
from studyFlax.models.calendar import Schedule
from studyFlax.serialiser import CalendarEventSerialiser

class ScheduleSerialiser(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = ['title', 'user', 'event', 'deadline']
        
    