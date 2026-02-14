from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.serialisers.auth_serialisers import UserSerialiser
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models import User
import re


def extract_module_code(title):
    """Extract module code from event title like '5CCS2PEP PRACTICAL...'"""
    match = re.match(r'^([0-9][A-Z0-9]{6,8})', title)
    return match.group(1) if match else None


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    if request.method == 'GET':
        user = request.user
        
        events = CalendarEvent.objects.filter(user=user)
        event_count = events.count()
        
        module_codes = set()
        for event in events:
            code = extract_module_code(event.title)
            if code:
                module_codes.add(code)
        
        module_count = len(module_codes)
        task_count = 0
        
        user_data = UserSerialiser(user, context={'request': request}).data
        user_data['event_count'] = event_count
        user_data['module_count'] = module_count
        user_data['task_count'] = task_count
        user_data['modules'] = sorted(list(module_codes))
        
        return Response(user_data)
    
    elif request.method == 'PATCH':
        user = request.user
        
        if 'username' in request.data:
            new_username = request.data['username']
            if new_username != user.username:
                if User.objects.filter(username=new_username).exists():
                    return Response(
                        {'error': 'Username already taken'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                user.username = new_username
        
        if 'bio' in request.data:
            user.bio = request.data['bio']
        if 'profile_photo' in request.FILES:
            user.profile_photo = request.FILES['profile_photo']
        elif request.data.get('remove_photo') == 'true':
            user.profile_photo = None
        
        user.save()
        
        user_data = UserSerialiser(user, context={'request': request}).data
        
        events = CalendarEvent.objects.filter(user=user)
        event_count = events.count()
        module_codes = set()
        for event in events:
            code = extract_module_code(event.title)
            if code:
                module_codes.add(code)
        
        user_data['event_count'] = event_count
        user_data['module_count'] = len(module_codes)
        user_data['task_count'] = 0
        user_data['modules'] = sorted(list(module_codes))
        
        return Response(user_data)
