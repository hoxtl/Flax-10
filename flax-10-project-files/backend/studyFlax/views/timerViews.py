from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.serialisers.timerSerializer import StudySessionSerializer

class StudySessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows study sessions to be viewed or edited.
    """
    serializer_class = StudySessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return sessions belonging to the current user
        return StudySession.objects.filter(user=self.request.user).order_by('-end_time')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['delete'])
    def clear_history(self, request):
        """
        Delete all study sessions for the current user.
        """
        deleted_count, _ = self.get_queryset().delete()
        return Response(
            {"message": f"Successfully deleted {deleted_count} sessions."},
            status=status.HTTP_204_NO_CONTENT
        )
