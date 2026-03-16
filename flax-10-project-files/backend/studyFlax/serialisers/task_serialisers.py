"""
Serialisers for tasks and task lists.
"""

from rest_framework import serializers
from django.utils import timezone
from studyFlax.models.tasks.taskModel import Task, TaskList
from studyFlax.utils.reading_utils import update_reading_estimates

def _sync_status_and_completed(validated_data, instance):
    """Synchronise the status and completed fields in validated_data."""
    if 'completed' in validated_data and 'status' not in validated_data:
        validated_data['status'] = 'done' if validated_data['completed'] else 'todo'
        return validated_data.get('completed', instance.completed)
    if 'status' in validated_data:
        validated_data['completed'] = (validated_data['status'] == 'done')
    return validated_data.get('completed', instance.completed)

def _update_completed_at(validated_data, completed, instance):
    """Set or clear completed_at based on the completed state."""
    if completed is True and not instance.completed_at:
        validated_data['completed_at'] = timezone.now()
        return
    if completed is False:
        validated_data['completed_at'] = None

class TaskListSerialiser(serializers.ModelSerializer):
    """Serialiser for task lists with a count of incomplete tasks."""

    task_count = serializers.SerializerMethodField()

    class Meta:
        model = TaskList
        fields = ['id', 'name', 'category', 'archived', 'task_count', 'created_at']

    def get_task_count(self, obj):
        """Return the number of incomplete tasks in this list."""
        return obj.tasks.filter(completed=False).count()

class TaskSerialiser(serializers.ModelSerializer):
    """Serialiser for individual tasks with related field summaries."""

    module_code = serializers.SerializerMethodField()
    list_name = serializers.SerializerMethodField()
    reading_id = serializers.IntegerField(source='reading.id', read_only=True)
    reading_page_count = serializers.SerializerMethodField()
    group_project_name = serializers.SerializerMethodField()
    assignees_info = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'task_list', 'list_name', 'module', 'module_code',
            'group_project', 'group_project_name', 'assigned_to', 'assignees_info',
            'title', 'description', 'priority', 'status', 'energy_level', 'due_date',
            'completed', 'completed_at', 'add_to_calendar', 'time_spent_minutes',
            'estimated_blocks', 'completed_blocks', 'page_count', 'reading_id',
            'reading_page_count', 'created_at', 'updated_at'
        ]

    def get_module_code(self, obj):
        """Return the module code if a module is linked."""
        return obj.module.module_code if obj.module else None

    def get_list_name(self, obj):
        """Return the name of the parent task list if set."""
        return obj.task_list.name if obj.task_list else None

    def get_reading_page_count(self, obj):
        """Return the total page count of the linked reading."""
        return obj.reading.page_count() if obj.reading_id else None

    def get_group_project_name(self, obj):
        """Return the name of the linked group project if set."""
        return obj.group_project.name if obj.group_project else None

    def get_assignees_info(self, obj):
        """Return a list of id/name dicts for all assignees."""
        return [
            {"id": u.id, "name": u.first_name or u.username}
            for u in obj.assigned_to.all()
        ]

    def create(self, validated_data):
        """Create a task, deriving the completed state from the status."""
        status_val = validated_data.get('status', 'todo')
        validated_data['status'] = status_val
        validated_data['completed'] = (status_val == 'done')
        if validated_data['completed']:
            validated_data['completed_at'] = timezone.now()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update a task, keeping status, completed, and timestamps in sync."""
        completed = _sync_status_and_completed(validated_data, instance)
        _update_completed_at(validated_data, completed, instance)
        updated = super().update(instance, validated_data)
        if completed is True and (updated.reading_id or updated.page_count):
            update_reading_estimates(updated.user)
        return updated
