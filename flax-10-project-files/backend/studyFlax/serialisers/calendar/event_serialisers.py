"""
Serialisers for calendar events and recurrence rules.
"""

import json
from rest_framework import serializers
from studyFlax.models import CalendarEvent, RecurrenceRule, Tag
from .tag_serialisers import TagSerialiser


class RecurrenceSerialiser(serializers.ModelSerializer):
    """Serialiser for recurrence."""
    class Meta:
        """Metadata for recurrence serialiser."""
        model = RecurrenceRule
        fields = ['id', 'frequency', 'interval', 'end_date', 'count', 'exception_dates']

class CalendarEventSerialiser(serializers.ModelSerializer):
    """Serialiser for calendar event."""
    tag_details = TagSerialiser(source='tag', read_only=True)
    tag_name = serializers.CharField(source='tag.name', read_only=True, allow_null=True)
    recurrence_details = RecurrenceSerialiser(source='recurrence_rule', read_only=True)
    module_name = serializers.CharField(source='module.module_name', read_only=True, allow_null=True)
    module_code = serializers.CharField(source='module.module_code', read_only=True, allow_null=True)

    class Meta:
        """Metadata for calendar event serialiser."""
        model = CalendarEvent
        fields = ['id', 'title', 'description',
        'start_time', 'end_time', 'location',
         'location_latitude', 'location_longitude',
          'location_validated', 'tag',
        'tag_name', 'tag_details', 'recurrence_details',
        'recurrence_rule', 'reminder_minutes',
        'source', 'external_id', 'module', 'module_name', 'module_code', 'is_private']

class CalendarEventCreateSerialiser(serializers.ModelSerializer):
    """Serialiser for calendar event create."""
    recurrence_rule = serializers.JSONField(required=False, allow_null=True)
    tag = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    location_latitude = serializers.FloatField(required=False, allow_null=True)
    location_longitude = serializers.FloatField(required=False, allow_null=True)
    location_validated = serializers.BooleanField(required=False, default=False)

    class Meta:
        """Metadata for calendar event create serialiser."""
        model = CalendarEvent
        fields = ['id', 'title', 'description',
        'start_time', 'end_time', 'location', 'tag',
        'location_latitude', 'location_longitude', 'location_validated',
        'recurrence_rule', 'reminder_minutes',
        'source', 'external_id', 'is_private']

    def _normalise_create_data(self, validated_data):
        recurrence_data = validated_data.pop('recurrence_rule', None)
        validated_data['tag'] = self._resolve_tag(validated_data.get('tag'))
        recurrence_rule = self._handle_recurrence(recurrence_data)
        return validated_data, recurrence_rule

    def create(self, validated_data):
        validated_data, recurrence_rule = self._normalise_create_data(validated_data)
        event = CalendarEvent.objects.create(recurrence_rule=recurrence_rule, **validated_data)
        return event

    def update(self, instance, validated_data):
        validated_data = self._apply_update_relations(instance, validated_data)
        return self._save_updated_instance(instance, validated_data)

    def _apply_update_relations(self, instance, validated_data):
        if 'recurrence_rule' in validated_data:
            recurrence_data = validated_data.pop('recurrence_rule')
            instance.recurrence_rule = self._handle_recurrence(recurrence_data, instance.recurrence_rule)
        if 'tag' in validated_data:
            validated_data['tag'] = self._resolve_tag(validated_data.get('tag'))
        return validated_data

    def _save_updated_instance(self, instance, validated_data):
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
        data = self._parse_recurrence_input(recurrence_data)
        if not data or not isinstance(data, dict):
            return self._delete_existing_rule(existing_rule)
        if existing_rule:
            return self._update_existing_rule(existing_rule, data)
        return RecurrenceRule.objects.create(**data)

    def _parse_recurrence_input(self, data):
        if not isinstance(data, str): return data
        try: return json.loads(data)
        except json.JSONDecodeError: return None

    def _delete_existing_rule(self, rule):
        if rule:
            rule.delete()
        return None

    def _update_existing_rule(self, rule, data):
        self._apply_rule_updates(rule, data)
        rule.save()
        return rule

    def _apply_rule_updates(self, rule, data):
        for key, value in data.items():
            setattr(rule, key, value)
