"""
ViewSet for creating and managing study timer sessions.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models as db_models
from studyFlax.models.timer.session_model import StudySession
from studyFlax.serialisers.timer.timer_serialisers import StudySessionSerializer


def _user_study_sessions(user):
    return StudySession.objects.filter(user=user).order_by("-end_time")


class StudySessionViewSet(viewsets.ModelViewSet):
    """API endpoint that allows study sessions to be viewed or edited."""

    serializer_class = StudySessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _study_sessions(self):
        return _user_study_sessions(self.request.user)

    def get_queryset(self):
        return self._study_sessions()

    def perform_create(self, serializer):
        self._create_study_session(serializer)

    def _create_study_session(self, serializer):
        serializer.save(user=self.request.user)
        task_id = self.request.data.get("task_id")
        self._increment_task_completed_blocks(task_id)

    def _increment_task_completed_blocks(self, task_id):
        if not task_id:
            return
        from studyFlax.models.tasks.task_model import Task

        Task.objects.filter(id=task_id, user=self.request.user).update(
            completed_blocks=db_models.F("completed_blocks") + 1
        )

    def _deleted_session_response(self, deleted_count):
        return Response(
            {"message": f"Successfully deleted {deleted_count} sessions."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["delete"])
    def clear_history(self, request):
        """Delete all study sessions for the current user."""
        return self._clear_history_result()

    def _clear_history_result(self):
        deleted_count, _ = self.get_queryset().delete()
        return self._deleted_session_response(deleted_count)
