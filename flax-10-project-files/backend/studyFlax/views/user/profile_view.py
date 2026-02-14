from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.serialisers.auth_serialisers import UserSerialiser
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models import User
from datetime import datetime, timedelta
from django.utils import timezone
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
        
        # Get all user's events
        all_events = CalendarEvent.objects.filter(user=user)
        
        # Get current time
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        week_end = today_start + timedelta(days=7)
        month_end = today_start + timedelta(days=30)
        
        # Filter events by time range (upcoming only)
        upcoming_events = all_events.filter(start_time__gte=now)
        today_events = all_events.filter(start_time__gte=today_start, start_time__lt=today_end)
        week_events = all_events.filter(start_time__gte=now, start_time__lt=week_end)
        month_events = all_events.filter(start_time__gte=now, start_time__lt=month_end)
        
        # Count events - TOTAL is ALL upcoming events, not just this month
        total_upcoming = upcoming_events.count()
        today_count = today_events.count()
        week_count = week_events.count()
        month_count = month_events.count()
        
        # Extract module codes from ALL upcoming events
        module_codes = set()
        for event in upcoming_events:
            code = extract_module_code(event.title)
            if code:
                module_codes.add(code)
        
        module_count = len(module_codes)
        task_count = 0
        
        user_data = UserSerialiser(user, context={'request': request}).data
        user_data['event_count'] = total_upcoming  # ALL upcoming events
        user_data['events_today'] = today_count
        user_data['events_week'] = week_count
        user_data['events_month'] = month_count
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
        
        # Return same structure as GET
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        week_end = today_start + timedelta(days=7)
        month_end = today_start + timedelta(days=30)
        
        all_events = CalendarEvent.objects.filter(user=user)
        upcoming_events = all_events.filter(start_time__gte=now)
        today_events = all_events.filter(start_time__gte=today_start, start_time__lt=today_end)
        week_events = all_events.filter(start_time__gte=now, start_time__lt=week_end)
        month_events = all_events.filter(start_time__gte=now, start_time__lt=month_end)
        
        module_codes = set()
        for event in upcoming_events:
            code = extract_module_code(event.title)
            if code:
                module_codes.add(code)
        
        user_data = UserSerialiser(user, context={'request': request}).data
        user_data['event_count'] = upcoming_events.count()  # ALL upcoming
        user_data['events_today'] = today_events.count()
        user_data['events_week'] = week_events.count()
        user_data['events_month'] = month_events.count()
        user_data['module_count'] = len(module_codes)
        user_data['task_count'] = 0
        user_data['modules'] = sorted(list(module_codes))
        
        return Response(user_data)
