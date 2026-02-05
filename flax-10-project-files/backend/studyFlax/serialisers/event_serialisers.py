from rest_framework import serializers
from studyFlax.models import Event, RecurrenceRule
from .tag_serialisers import TagSerialiser

class RecurrenceSerialiser(serializers.ModelSerializer):
    class Meta:
        model = RecurrenceRule
        fields = ['id', 'frequency', 'interval', 'end_date', 'count']

class EventSerialiser(serializers.ModelSerializer):
    tag_details = TagSerialiser(source='tags', read_only=True)
    recurrence_details = RecurrenceSerialiser(source='recurrence_rule', read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 
        'start_time', 'end_time', 'location', 'tag', 
        'category', 'tag_details', 'recurrence_details', 
        'recurrence', 'reminder_minutes']

class EventCreateSerialiser(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 
        'start_time', 'end_time', 'location', 'tag', 
        'recurrence', 'reminder_minutes']
        
