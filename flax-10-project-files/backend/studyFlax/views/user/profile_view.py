from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.serialisers.auth_serialisers import UserSerialiser
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models.modules.enrollmentModel import Enrollment
from studyFlax.models.modules.moduleModel import Module
from studyFlax.models import User
from datetime import timedelta
from django.utils import timezone

def get_module_data(user):
    taught_modules = Module.objects.filter(created_by=user).only('module_code')
    is_teacher = getattr(user, 'role', None) == 'teacher'

    # Prefer "modules taught" for teachers and for any user that owns modules.
    # This keeps profile module lists accurate even when role data is stale.
    if is_teacher or taught_modules.exists():
        module_codes = sorted([m.module_code for m in taught_modules])
        return module_codes, len(module_codes)

    enrollments = Enrollment.objects.filter(student=user).select_related('module')
    module_codes = sorted([e.module.module_code for e in enrollments])
    return module_codes, len(module_codes)

def get_event_counts(user):
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    all_events = CalendarEvent.objects.filter(user=user)
    upcoming = all_events.filter(start_time__gte=now)
    return {
        'event_count': upcoming.count(),
        'events_today': all_events.filter(start_time__gte=today_start, start_time__lt=today_start + timedelta(days=1)).count(),
        'events_week': all_events.filter(start_time__gte=now, start_time__lt=today_start + timedelta(days=7)).count(),
        'events_month': all_events.filter(start_time__gte=now, start_time__lt=today_start + timedelta(days=30)).count(),
    }

def build_profile_response(user, request):
    module_codes, module_count = get_module_data(user)
    event_counts = get_event_counts(user)
    user_data = UserSerialiser(user, context={'request': request}).data
    user_data.update(event_counts)
    user_data['module_count'] = module_count
    user_data['task_count'] = 0
    user_data['modules'] = module_codes
    return user_data

def update_username(user, data):
    new_username = data.get('username')
    if not new_username or new_username == user.username:
        return None
    if User.objects.filter(username=new_username).exists():
        return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)
    user.username = new_username
    return None

def update_photo(user, data, files):
    if 'profile_photo' in files:
        user.profile_photo = files['profile_photo']
        return
    if data.get('remove_photo') == 'true':
        user.profile_photo = None

def apply_profile_patch(user, data, files):
    error = update_username(user, data)
    if error:
        return error
    if 'weekly_goal_hours' in data:
        user.weekly_goal_hours = int(data['weekly_goal_hours'])
    if 'bio' in data:
        user.bio = data['bio']
    update_photo(user, data, files)
    user.save()
    return None

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    if request.method == 'GET':
        return Response(build_profile_response(request.user, request))
    error = apply_profile_patch(request.user, request.data, request.FILES)
    if error:
        return error
    return Response(build_profile_response(request.user, request))

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def another_user_profile_view(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    return Response(build_profile_response(user, request))
