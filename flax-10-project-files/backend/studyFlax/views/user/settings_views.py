from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.auth.userSettingsModel import UserSettings

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_settings_view(request):
    """Get or update user settings (theme, timezone)"""
    user = request.user
    
    # Get or create settings
    settings, created = UserSettings.objects.get_or_create(
        user=user,
        defaults={
            'theme': 'light',
            'timezone': 'Europe/London'
        }
    )
    
    if request.method == 'GET':
        return Response({
            'theme': settings.theme,
            'timezone': settings.timezone
        })
    
    elif request.method == 'PUT':
        # Update settings
        if 'theme' in request.data:
            settings.theme = request.data['theme']
        if 'timezone' in request.data:
            settings.timezone = request.data['timezone']
        
        settings.save()
        
        return Response({
            'theme': settings.theme,
            'timezone': settings.timezone
        })
