"""
Views for retrieving and updating user preferences and onboarding data.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.auth.user_settings_model import UserSettings
from studyFlax.serialisers.user.user_settings_serialisers import UserSettingsSerialiser
from studyFlax.views.modules.enrollment_logic import enroll_user_in_modules, get_modules_for_major

DEFAULT_SETTINGS = {
    "theme": "light",
    "timezone": "Europe/London",
}

def get_or_create_user_settings(user, defaults=None):
    """Return persisted user settings with safe defaults."""

    payload = DEFAULT_SETTINGS | (defaults or {})
    settings, _ = UserSettings.objects.get_or_create(user=user, defaults=payload)
    return settings

def apply_settings_updates(settings, data):
    serializer = UserSettingsSerialiser(settings, data=data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    payload = serializer.data
    return Response({**payload, "settings": dict(payload)})


def _missing_onboarding_fields_response():
    return Response({'error': 'year and major are required'}, status=status.HTTP_400_BAD_REQUEST)


def _save_onboarding_settings(settings, year, major):
    settings.year, settings.major = year, major
    settings.save()


def _onboarding_response(request, year, major):
    settings = get_or_create_user_settings(request.user)
    _save_onboarding_settings(settings, year, major)
    enrolled_count = enroll_user_in_modules(request.user, get_modules_for_major(major))
    return Response({'enrolled_modules': enrolled_count, 'year': year, 'major': major})

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_settings_view(request):
    settings = get_or_create_user_settings(request.user)
    if request.method == 'GET':
        serialized = UserSettingsSerialiser(settings).data
        return Response({**serialized, "settings": dict(serialized)})
    return apply_settings_updates(settings, request.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def onboarding_view(request):
    year, major = request.data.get('year'), request.data.get('major')
    if not year or not major:
        return _missing_onboarding_fields_response()
    return _onboarding_response(request, year, major)
