from rest_framework import serializers
from studyFlax.models.taskModel import Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = "__all__"
