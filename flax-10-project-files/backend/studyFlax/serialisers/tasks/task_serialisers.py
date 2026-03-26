"""
Serialisers for tasks and task lists.
"""

from rest_framework import serializers
from django.utils import timezone
from studyFlax.models.tasks.task_model import Task, TaskList
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

def _module_attr(obj, field):
    module = getattr(obj, "module", None)
    return getattr(module, field, None)

def _task_list_name(obj):
    task_list = getattr(obj, "task_list", None)
    return getattr(task_list, "name", None)

def _task_list_society(obj):
    task_list = getattr(obj, "task_list", None)
    return getattr(task_list, "society", None)

def _task_list_society_id(obj):
    society = _task_list_society(obj)
    return getattr(society, "id", None)

def _task_list_society_name(obj):
    society = _task_list_society(obj)
    return getattr(society, "name", None)

def _society_attr(obj, field):
    society = getattr(obj, "society", None)
    return getattr(society, field, None)

def _reading(obj):
    return getattr(obj, "reading", None) if obj.reading_id else None

def _reading_attr(obj, field):
    reading = _reading(obj)
    return getattr(reading, field, None)

def _reading_page_count(obj):
    reading = _reading(obj)
    return reading.page_count() if reading else None

def _group_project_name(obj):
    group_project = getattr(obj, "group_project", None)
    return getattr(group_project, "name", None)

class TaskListSerialiser(serializers.ModelSerializer):
    """Serialiser for task lists with a count of incomplete tasks."""

    task_count = serializers.SerializerMethodField()
    society_id = serializers.SerializerMethodField()
    society_name = serializers.SerializerMethodField()

    class Meta:
        """Metadata for task list serialiser."""
        model = TaskList
        fields = ['id', 'name', 'category', 'archived', 'task_count', 'created_at', 'society_id', 'society_name']

    def get_task_count(self, obj):
        return obj.tasks.filter(completed=False).count()

    def get_society_id(self, obj):
        return _society_attr(obj, "id")

    def get_society_name(self, obj):
        return _society_attr(obj, "name")

class TaskSerialiser(serializers.ModelSerializer):
    """Serialiser for individual tasks with related field summaries."""

    module_code = serializers.SerializerMethodField()
    module_name = serializers.SerializerMethodField()
    list_name = serializers.SerializerMethodField()
    society_id = serializers.SerializerMethodField()
    society_name = serializers.SerializerMethodField()
    reading_id = serializers.SerializerMethodField()
    reading_page_count = serializers.SerializerMethodField()
    reading_chapter = serializers.SerializerMethodField()
    reading_start_page = serializers.SerializerMethodField()
    reading_end_page = serializers.SerializerMethodField()
    group_project_name = serializers.SerializerMethodField()
    assignees_info = serializers.SerializerMethodField()

    class Meta:
        """Metadata for task serialiser."""
        model = Task
        fields = [
            'id', 'task_list', 'list_name', 'module', 'module_code', 'module_name',
            'society_id', 'society_name',
            'group_project', 'group_project_name', 'assigned_to', 'assignees_info',
            'title', 'description', 'priority', 'status', 'energy_level', 'due_date',
            'completed', 'completed_at', 'add_to_calendar', 'time_spent_minutes',
            'estimated_blocks', 'completed_blocks', 'page_count', 'reading_id',
            'reading_page_count', 'reading_chapter', 'reading_start_page',
            'reading_end_page', 'created_at', 'updated_at'
        ]

    def _get_module_code(self, obj):
        return _module_attr(obj, "module_code")

    def _get_module_name(self, obj):
        return _module_attr(obj, "module_name")

    def _get_list_name(self, obj):
        return _task_list_name(obj)

    def _get_society_id(self, obj):
        return _task_list_society_id(obj)

    def _get_society_name(self, obj):
        return _task_list_society_name(obj)

    def _get_reading_id(self, obj):
        return obj.reading_id if obj.reading_id else None

    def _get_reading_page_count(self, obj):
        return _reading_page_count(obj)

    def _get_reading_chapter(self, obj):
        return _reading_attr(obj, "chapter")

    def _get_reading_start_page(self, obj):
        return _reading_attr(obj, "start_page")

    def _get_reading_end_page(self, obj):
        return _reading_attr(obj, "end_page")

    def _get_group_project_name(self, obj):
        return _group_project_name(obj)

    def _get_assignees_info(self, obj):
        return [
            {"id": u.id, "name": u.first_name or u.username}
            for u in obj.assigned_to.all()
        ]

    def _create(self, validated_data):
        """Create a task, deriving the completed state from the status."""
        status_val = validated_data.get('status', 'todo')
        validated_data['status'] = status_val
        validated_data['completed'] = (status_val == 'done')
        if validated_data['completed']:
            validated_data['completed_at'] = timezone.now()
        return super().create(validated_data)

    def _update(self, instance, validated_data):
        """Update a task, keeping status, completed, and timestamps in sync."""
        completed = _sync_status_and_completed(validated_data, instance)
        _update_completed_at(validated_data, completed, instance)
        updated = super().update(instance, validated_data)
        if completed is True and (updated.reading_id or updated.page_count):
            update_reading_estimates(updated.user)
        return updated


TaskSerialiser.get_module_code = TaskSerialiser._get_module_code
TaskSerialiser.get_module_name = TaskSerialiser._get_module_name
TaskSerialiser.get_list_name = TaskSerialiser._get_list_name
TaskSerialiser.get_society_id = TaskSerialiser._get_society_id
TaskSerialiser.get_society_name = TaskSerialiser._get_society_name
TaskSerialiser.get_reading_id = TaskSerialiser._get_reading_id
TaskSerialiser.get_reading_page_count = TaskSerialiser._get_reading_page_count
TaskSerialiser.get_reading_chapter = TaskSerialiser._get_reading_chapter
TaskSerialiser.get_reading_start_page = TaskSerialiser._get_reading_start_page
TaskSerialiser.get_reading_end_page = TaskSerialiser._get_reading_end_page
TaskSerialiser.get_group_project_name = TaskSerialiser._get_group_project_name
TaskSerialiser.get_assignees_info = TaskSerialiser._get_assignees_info
TaskSerialiser.create = TaskSerialiser._create
TaskSerialiser.update = TaskSerialiser._update
