from rest_framework import viewsets
from studyFlax.models import Task
from studyFlax.serialisers.taskSerializer import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    queryset = Task.objects.all()
