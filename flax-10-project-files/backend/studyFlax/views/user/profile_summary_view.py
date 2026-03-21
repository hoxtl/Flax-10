<<<<<<< HEAD
"""
View for user profile summaries.
"""
=======
"""Profile summary API view."""
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

from datetime import timedelta

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models.timer.session_model import StudySession
<<<<<<< HEAD

from .profile_summary_payload import build_profile_summary, resolve_user
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

from .profile_summary_badges import compute_badges, compute_streaks, derive_persona, get_weekly_study_hours
from .profile_summary_payload import build_profile_summary, resolve_user

<<<<<<< HEAD
def _recent_sessions(sessions_all):
    cutoff = timezone.now() - timedelta(days=90)
    return [session for session in sessions_all if session.end_time >= cutoff]
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_summary_view(request):
<<<<<<< HEAD
    return Response(_profile_summary_payload(request))

def _profile_summary_payload(request):
    user = resolve_user(request)
    sessions_all = list(StudySession.objects.filter(user=user))
    sessions_90 = _recent_sessions(sessions_all)
    return build_profile_summary(user, sessions_all, sessions_90, request)
=======
    user = resolve_user(request)
    sessions_all = list(StudySession.objects.filter(user=user))
    sessions_90 = [session for session in sessions_all if session.end_time >= timezone.now() - timedelta(days=90)]
    return Response(build_profile_summary(user, sessions_all, sessions_90, request))
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
