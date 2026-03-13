from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.auth.userSettingsModel import UserSettings
from studyFlax.serialisers.user_settings_serialisers import UserSettingsSerialiser
from studyFlax.serialisers.auth_serialisers import UserSerialiser


def update_user_name(user, data):
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']

def update_user_password(user, data):
    password = data.get('password')
    if not password:
        return None
    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(password)
    return None

def apply_user_updates(user, data):
    update_user_name(user, data)
    error = update_user_password(user, data)
    if error:
        return error
    user.save()
    return None

def patch_settings(settings, data, user):
    serialiser = UserSettingsSerialiser(settings, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response({'settings': serialiser.data, 'user': UserSerialiser(user).data})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_settings_view(request):
    settings, _ = UserSettings.objects.get_or_create(
        user=request.user,
        defaults={'theme': 'light', 'timezone': 'Europe/London'},
    )
    if request.method == 'GET':
        return Response(UserSettingsSerialiser(settings).data)
    error = apply_user_updates(request.user, request.data)
    if error:
        return error
    return patch_settings(settings, request.data, request.user)