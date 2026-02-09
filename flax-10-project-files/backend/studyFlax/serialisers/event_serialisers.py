import json
from rest_framework import serializers
from studyFlax.models import CalendarEvent, RecurrenceRule, Tag
from .tag_serialisers import TagSerialiser

class RecurrenceSerialiser(serializers.ModelSerializer):
    class Meta:
        model = RecurrenceRule
        fields = ['id', 'frequency', 'interval', 'end_date', 'count', 'exception_dates']

class CalendarEventSerialiser(serializers.ModelSerializer):
    tag_details = TagSerialiser(source='tag', read_only=True)
    tag_name = serializers.CharField(source='tag.name', read_only=True, allow_null=True)
    recurrence_details = RecurrenceSerialiser(source='recurrence_rule', read_only=True)

    class Meta:
        model = CalendarEvent
        fields = ['id', 'title', 'description',
        'start_time', 'end_time', 'location', 'tag',
        'tag_name', 'tag_details', 'recurrence_details',
        'recurrence_rule', 'reminder_minutes',
        'source', 'external_id']

class CalendarEventCreateSerialiser(serializers.ModelSerializer):
    recurrence_rule = serializers.JSONField(required=False, allow_null=True)
    tag = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = CalendarEvent
        fields = ['id', 'title', 'description',
        'start_time', 'end_time', 'location', 'tag',
        'recurrence_rule', 'reminder_minutes',
        'source', 'external_id']

    def create(self, validated_data):
        recurrence_data = validated_data.pop('recurrence_rule', None)
        validated_data['tag'] = self._resolve_tag(validated_data.get('tag'))
        recurrence_rule = self._handle_recurrence(recurrence_data)
        event = CalendarEvent.objects.create(recurrence_rule=recurrence_rule, **validated_data)
        return event

    def update(self, instance, validated_data):
        if 'recurrence_rule' in validated_data:
            recurrence_data = validated_data.pop('recurrence_rule')
            instance.recurrence_rule = self._handle_recurrence(recurrence_data, instance.recurrence_rule)
        if 'tag' in validated_data:
            validated_data['tag'] = self._resolve_tag(validated_data.get('tag'))
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def _resolve_tag(self, tag_value):
        if not tag_value:
            return None
        if isinstance(tag_value, int) or (isinstance(tag_value, str) and tag_value.isdigit()):
            return Tag.objects.filter(id=int(tag_value)).first()
        tag, _ = Tag.objects.get_or_create(name=tag_value, defaults={'is_default': True})
        return tag
    
    def _handle_recurrence(self, recurrence_data, existing_rule=None):
        if isinstance(recurrence_data, str):
            try:
                recurrence_data = json.loads(recurrence_data)
            except json.JSONDecodeError:
                pass
        
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