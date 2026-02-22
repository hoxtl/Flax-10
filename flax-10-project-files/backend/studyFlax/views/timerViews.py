from django.db import models as db_models
from rest_framework import viewsets, permissions
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.serialisers.timer_serialisers import StudySessionSerializer


class StudySessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows study sessions to be viewed or edited.
    """
    serializer_class = StudySessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudySession.objects.filter(user=self.request.user).order_by('-end_time')

    def perform_create(self, serializer):
        session = serializer.save(user=self.request.user)

        # If a task_id was sent with the session, increment its completed_blocks.
        task_id = self.request.data.get('task_id')
        if task_id:
            from studyFlax.models.tasks.taskModel import Task
            Task.objects.filter(
                id=task_id,
                user=self.request.user
            ).update(
                completed_blocks=db_models.F('completed_blocks') + 1
            )