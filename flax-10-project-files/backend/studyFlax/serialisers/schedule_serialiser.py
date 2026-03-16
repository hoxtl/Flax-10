from rest_framework import serializers
from studyFlax.serialisers.event_serialisers import CalendarEventSerialiser
from studyFlax.models import Deadline, Schedule, ScheduleEventAllocation

class ScheduleEventAllocationSerialiser(serializers.ModelSerializer):
    event = CalendarEventSerialiser(read_only=True)
    deadline_title = serializers.CharField(source='deadline.title', read_only=True)

    class Meta:
        model = ScheduleEventAllocation
        fields = ['id', 'event', 'deadline', 'deadline_title', 'allocated_minutes']

class ScheduleSerialiser(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only = True)
    event_allocations = ScheduleEventAllocationSerialiser(many=True, read_only=True)
    deadline = serializers.PrimaryKeyRelatedField(queryset=Deadline.objects.all(), many=True)

    class Meta:
        model = Schedule
        fields = [
            'id',
            'title',
            'user',
            'event',
            'deadline',
            'preferred_start_time',
            'preferred_end_time',
            'worktime_preference',
            'week_preference',
            'event_allocations',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'event_allocations']

class DeadlinePlanningPreferenceSerialiser(serializers.Serializer):
    deadline_id = serializers.IntegerField()
    ideal_minutes_per_day = serializers.IntegerField(min_value=1)


class AutoScheduleRequestSerialiser(serializers.Serializer):
    title = serializers.CharField(max_length=100, required=False, default='Auto schedule')
    preferred_start_time = serializers.TimeField(required=False, allow_null=True)
    preferred_end_time = serializers.TimeField(required=False, allow_null=True)
    worktime_preference = serializers.ChoiceField(choices=['day', 'night', 'both'], required=False, allow_null=True)
    week_preference = serializers.ChoiceField(choices=['weekdays', 'weekends', 'both'], required=False, allow_null=True)
    clear_existing = serializers.BooleanField(default=False)
    deadline_preferences = DeadlinePlanningPreferenceSerialiser(many=True)

    def validate_deadline_preferences(self, value):
        ids = [item['deadline_id'] for item in value]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError('Each deadline must appear only once.')
        return value
