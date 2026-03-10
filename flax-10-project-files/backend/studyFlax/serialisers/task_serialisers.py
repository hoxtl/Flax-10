from rest_framework import serializers
from django.utils import timezone
from studyFlax.models.tasks.taskModel import Task, TaskList
from studyFlax.utils.reading_utils import update_reading_estimates

class TaskListSerialiser(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = TaskList
        fields = ['id', 'name', 'category', 'archived', 'task_count', 'created_at']

    def get_task_count(self, obj):
        return obj.tasks.filter(completed=False).count()


class TaskSerialiser(serializers.ModelSerializer):
    module_code = serializers.SerializerMethodField()
    list_name = serializers.SerializerMethodField()
    reading_id = serializers.IntegerField(source='reading.id', read_only=True)
    reading_page_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'task_list', 'list_name', 'module', 'module_code',
            'title', 'description', 'priority', 'energy_level', 'due_date',
            'completed', 'completed_at', 'add_to_calendar', 'time_spent_minutes',
            'estimated_blocks', 'completed_blocks', 'page_count', 'reading_id',
            'reading_page_count', 'created_at', 'updated_at'
        ]

    def get_module_code(self, obj):
        return obj.module.module_code if obj.module else None

    def get_list_name(self, obj):
        return obj.task_list.name if obj.task_list else None

    def set_time_completed(self, instance, validated_data):
        completed = validated_data.get('completed')
        if completed is True and not instance.completed_at:
            validated_data['completed_at'] = timezone.now()
        elif completed is False:
            validated_data['completed_at'] = None

    def update(self, instance, validated_data):
        completed = validated_data.get('completed')
        self.set_time_completed(instance, validated_data)
        updated = super().update(instance, validated_data)
        if completed is True and (updated.reading_id or updated.page_count):
            update_reading_estimates(updated.user)
        return updated