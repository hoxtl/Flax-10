"""Profile summary API view."""

from datetime import timedelta

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models.timer.session_model import StudySession
from studyFlax.views.analytics.session_analytics_service import compute_streaks

from .profile_summary_badges import compute_badges, derive_persona, get_weekly_study_hours
from .profile_summary_payload import build_profile_summary, resolve_user


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_summary_view(request):
    user = resolve_user(request)
    sessions_all = list(StudySession.objects.filter(user=user))
    sessions_90 = [session for session in sessions_all if session.end_time >= timezone.now() - timedelta(days=90)]
    return Response(build_profile_summary(user, sessions_all, sessions_90, request))
