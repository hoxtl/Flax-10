from rest_framework import serializers
from studyFlax.models import CalendarEvent, RecurrenceRule
from .tag_serialisers import TagSerialiser

class RecurrenceSerialiser(serializers.ModelSerializer):
    class Meta:
        model = RecurrenceRule
        fields = ['id', 'frequency', 'interval', 'end_date', 'count']

class CalendarEventSerialiser(serializers.ModelSerializer):
    tag_details = TagSerialiser(source='tags', read_only=True)
    recurrence_details = RecurrenceSerialiser(source='recurrence_rule', read_only=True)

    class Meta:
        model = CalendarEvent
        fields = ['id', 'title', 'description', 
        'start_time', 'end_time', 'location', 'tag', 
        'tag_details', 'recurrence_details', 
        'recurrence_rule', 'reminder_minutes']

class CalendarEventCreateSerialiser(serializers.ModelSerializer):
    recurrence_rule = serializers.JSONField(required=False, allow_null=True)
    
    class Meta:
        model = CalendarEvent
        fields = ['id', 'title', 'description', 
        'start_time', 'end_time', 'location', 'tag', 
        'recurrence_rule', 'reminder_minutes']
    
    def create(self, validated_data):
        recurrence_data = validated_data.pop('recurrence_rule', None)
        recurrence_rule = self._handle_recurrence(recurrence_data)
        event = CalendarEvent.objects.create(recurrence_rule=recurrence_rule, **validated_data)
        return event
    
    def update(self, instance, validated_data):
        recurrence_data = validated_data.pop('recurrence_rule', None)
        instance.recurrence_rule = self._handle_recurrence(recurrence_data, instance.recurrence_rule)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
    
    def _handle_recurrence(self, recurrence_data, existing_rule=None):
        if not recurrence_data or not isinstance(recurrence_data, dict):
            return self._delete_existing_rule(existing_rule)
        if existing_rule:
            return self._update_existing_rule(existing_rule, recurrence_data)
        return RecurrenceRule.objects.create(**recurrence_data)
    
    def _delete_existing_rule(self, rule):
        if rule:
            rule.delete()
        return None
    
    def _update_existing_rule(self, rule, data):
        for key, value in data.items():
            setattr(rule, key, value)
        rule.save()
        return rule


