from rest_framework import viewsets
from studyFlax.models.taskModel import Task
from studyFlax.serializers.taskSerializer import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
