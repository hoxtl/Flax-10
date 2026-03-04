from rest_framework import serializers
from studyFlax.models import TaskList, Task


class TaskListSerialiser(serializers.ModelSerializer):
    class Meta:
        model = TaskList
        fields = ["id", "name", "color", "archived", "order"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class TaskSerialiser(serializers.ModelSerializer):
    task_list = serializers.PrimaryKeyRelatedField(
        queryset=TaskList.objects.none(), required=False, allow_null=True
    )
    module_code = serializers.SerializerMethodField()
    module_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id", "task_list", "module", "module_code", "module_name", "title", "description", "completed", "due_date",
            "priority", "estimated_blocks", "completed_blocks", "time_spent_minutes",
            "completed_at", "energy_level", "add_to_calendar", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_module_code(self, obj):
        if obj.module_id:
            return getattr(obj.module, "module_code", None)
        return None

    def get_module_name(self, obj):
        if obj.module_id:
            return getattr(obj.module, "module_name", None)
        return None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context.get("request") and self.context["request"].user
        if user and user.is_authenticated:
            self.fields["task_list"].queryset = TaskList.objects.filter(user=user)

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
