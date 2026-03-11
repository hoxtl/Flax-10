from rest_framework import serializers
from django.utils import timezone
from studyFlax.models.tasks.taskModel import Task, TaskList


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
    group_project_name = serializers.SerializerMethodField()


    assignees_info = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'task_list', 'list_name', 'module', 'module_code',
            'group_project', 'group_project_name', 'assigned_to', 'assignees_info',

            'title', 'description', 'priority', 'status', 'energy_level', 'due_date',
            'completed', 'completed_at', 'add_to_calendar', 'time_spent_minutes',
            'estimated_blocks', 'completed_blocks',
            'created_at', 'updated_at'
        ]

    def get_module_code(self, obj):
        return obj.module.module_code if obj.module else None

    def get_list_name(self, obj):
        return obj.task_list.name if obj.task_list else None

    def get_group_project_name(self, obj):
        return obj.group_project.name if obj.group_project else None


    def get_assignees_info(self, obj):
        return [
            {"id": u.id, "name": u.first_name or u.username}
            for u in obj.assigned_to.all()
        ]

    def create(self, validated_data):
        # Handle status logic explicitly upon creation
        status_val = validated_data.get('status', 'todo')
        validated_data['status'] = status_val
        validated_data['completed'] = (status_val == 'done')
        
        if validated_data['completed']:
            validated_data['completed_at'] = timezone.now()
            
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Sync completed and status fields
        status = validated_data.get('status', instance.status)
        completed = validated_data.get('completed', instance.completed)
        
        # If toggling 'completed' directly from older UI
        if 'completed' in validated_data and 'status' not in validated_data:
            validated_data['status'] = 'done' if completed else 'todo'
        # If updating status from new UI
        elif 'status' in validated_data:
            validated_data['completed'] = (status == 'done')
            completed = validated_data['completed']

        if completed is True and not instance.completed_at:
            validated_data['completed_at'] = timezone.now()
        elif completed is False:
            validated_data['completed_at'] = None
            
        return super().update(instance, validated_data)