from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.auth.userSettingsModel import UserSettings
from studyFlax.serialisers.user_settings_serialisers import UserSettingsSerialiser
from studyFlax.serialisers.auth_serialisers import UserSerialiser


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_settings_view(request):
    """
    User settings view function to get or update user settings.
    """
    settings, created = UserSettings.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        settings_serialiser = UserSettingsSerialiser(settings)
        return Response(settings_serialiser.data)

    elif request.method == 'PATCH':
        user = request.user

        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
    
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        user.save()

        settings_serialiser = UserSettingsSerialiser(settings, data=request.data, partial=True)

        if settings_serialiser.is_valid():
            settings_serialiser.save()
            user_data = UserSerialiser(request.user).data
            return Response({'settings': settings_serialiser.data, 'user': user_data})
        
        return Response(settings_serialiser.errors, status=status.HTTP_400_BAD_REQUEST)