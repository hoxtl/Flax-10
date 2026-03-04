from rest_framework import viewsets, permissions
from studyFlax.models import TaskList, Task
from studyFlax.serialisers.task_serialisers import TaskListSerialiser, TaskSerialiser


class TaskListViewSet(viewsets.ModelViewSet):
    serializer_class = TaskListSerialiser
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TaskList.objects.filter(user=self.request.user).order_by("order", "id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerialiser
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).select_related("module").order_by("-due_date", "id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
