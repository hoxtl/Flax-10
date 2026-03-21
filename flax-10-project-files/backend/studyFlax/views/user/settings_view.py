"""
<<<<<<< HEAD
Views for updating user settings and onboarding data.
=======
Views for retrieving and updating user preferences and onboarding data.
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.auth.user_settings_model import UserSettings
from studyFlax.serialisers.user.user_settings_serialisers import UserSettingsSerialiser
<<<<<<< HEAD
from django.utils import timezone
from studyFlax.views.modules.enrollment_logic import enroll_user_in_modules, get_modules_for_major
from studyFlax.management.commands.seed_helpers.tasks.tasks import seed_new_user_tasks
from studyFlax.views.modules.new_user_projects import seed_new_user_projects


DEFAULT_HOMEPAGE_WIDGETS = ["hero", "deadlines", "todayTasks", "bigTimeline"]
DEFAULT_SETTINGS = {
    "theme": "light",
    "timezone": "Europe/London",
    "homepage_widgets": DEFAULT_HOMEPAGE_WIDGETS,
    "homepage_widget_sizes": {},
}


def settings_payload(data):
    """Return the shared settings response payload."""
    return {**data, "settings": dict(data)}

=======
from studyFlax.views.modules.enrollment_logic import enroll_user_in_modules, get_modules_for_major

DEFAULT_SETTINGS = {
    "theme": "light",
    "timezone": "Europe/London",
}

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def get_or_create_user_settings(user, defaults=None):
    """Return persisted user settings with safe defaults."""
    payload = DEFAULT_SETTINGS | (defaults or {})
    settings, _ = UserSettings.objects.get_or_create(user=user, defaults=payload)
    return settings

def apply_settings_updates(settings, data):
<<<<<<< HEAD
    """Apply partial settings updates."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    serializer = UserSettingsSerialiser(settings, data=data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
<<<<<<< HEAD
    return Response(settings_payload(serializer.data))

def _missing_onboarding_fields_response():
    """Return an error for incomplete onboarding data."""
    return Response({'error': 'year and major are required'}, status=status.HTTP_400_BAD_REQUEST)

def _save_onboarding_settings(settings, year, major):
    """Persist onboarding values on the user settings."""
    settings.year, settings.major = year, major
    settings.save()

def _seed_onboarding_content(user, major, now):
    """Seed content for a newly onboarded user."""
    enrolled_count = enroll_user_in_modules(user, get_modules_for_major(major))
    seed_new_user_tasks(user, now)
    seed_new_user_projects(user, now)
    return enrolled_count

def _onboarding_payload(year, major, enrolled_count):
    return {'enrolled_modules': enrolled_count, 'year': year, 'major': major}

def _onboarding_response(request, year, major):
    """Persist onboarding details and seed starter content."""
    settings = get_or_create_user_settings(request.user)
    _save_onboarding_settings(settings, year, major)
    enrolled_count = _seed_onboarding_content(request.user, major, timezone.now())
    return Response(_onboarding_payload(year, major, enrolled_count))
=======
    payload = serializer.data
    return Response({**payload, "settings": dict(payload)})
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_settings_view(request):
    settings = get_or_create_user_settings(request.user)
    if request.method == 'GET':
<<<<<<< HEAD
        serialised = UserSettingsSerialiser(settings).data
        return Response(settings_payload(serialised))
=======
        serialized = UserSettingsSerialiser(settings).data
        return Response({**serialized, "settings": dict(serialized)})
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    return apply_settings_updates(settings, request.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def onboarding_view(request):
<<<<<<< HEAD
    """Store onboarding details for the current user."""
    year, major = request.data.get('year'), request.data.get('major')
    if not year or not major:
        return _missing_onboarding_fields_response()
    return _onboarding_response(request, year, major)
=======
    year, major = request.data.get('year'), request.data.get('major')
    if not year or not major:
        return Response({'error': 'year and major are required'}, status=status.HTTP_400_BAD_REQUEST)
    settings = get_or_create_user_settings(request.user)
    settings.year, settings.major = year, major
    settings.save()
    enrolled_count = enroll_user_in_modules(request.user, get_modules_for_major(major))
    return Response({'enrolled_modules': enrolled_count, 'year': year, 'major': major})
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
