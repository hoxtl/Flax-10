from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.auth.userSettingsModel import UserSettings
from studyFlax.models.modules.moduleModel import Module
from studyFlax.serialisers.user_settings_serialisers import UserSettingsSerialiser
from studyFlax.fixtures.data_fixtures import course_to_module_prefixes
from studyFlax.views.modules.enrollment_logic import enroll_user_in_module


def get_or_create_settings(user):
    settings, _ = UserSettings.objects.get_or_create(
        user=user, defaults={'theme': 'flax', 'mode': 'light', 'timezone': 'Europe/London'}
    )
    return settings

def apply_settings_updates(settings, data):
    serializer = UserSettingsSerialiser(settings, data=data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    payload = serializer.data
    return Response({**payload, "settings": dict(payload)})

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_settings_view(request):
    settings = get_or_create_settings(request.user)
    if request.method == 'GET':
        serialized = UserSettingsSerialiser(settings).data
        return Response({**serialized, "settings": dict(serialized)})
    return apply_settings_updates(settings, request.data)


def get_modules_for_major(major):
    prefixes = course_to_module_prefixes.get(major, [])
    if not prefixes:
        return []
    pattern = r'^(' + '|'.join(prefixes) + ')'
    return list(Module.objects.filter(module_code__regex=pattern))

def enroll_user_in_modules(user, modules):
    return sum(1 for m in modules if enroll_user_in_module(user, m)[1])


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def onboarding_view(request):
    year, major = request.data.get('year'), request.data.get('major')
    if not year or not major:
        return Response({'error': 'year and major are required'}, status=status.HTTP_400_BAD_REQUEST)
    settings, _ = UserSettings.objects.get_or_create(user=request.user)
    settings.year, settings.major = year, major
    settings.save()
    enrolled_count = enroll_user_in_modules(request.user, get_modules_for_major(major))
    return Response({'enrolled_modules': enrolled_count, 'year': year, 'major': major})
