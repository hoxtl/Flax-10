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
        # Only return sessions belonging to the current user
        return StudySession.objects.filter(user=self.request.user).order_by('-end_time')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
