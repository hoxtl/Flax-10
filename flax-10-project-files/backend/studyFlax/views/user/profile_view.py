"""
Views for retrieving and updating user profile data.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.serialisers.auth.auth_serialisers import UserSerialiser
from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.models.modules.enrollment_model import Enrollment
from studyFlax.models.modules.module_model import Module
from studyFlax.models.timer.session_model import StudySession
from studyFlax.models.social.share_model import CalendarShare
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.models.notifications.notification_model import Notification
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

def get_last_session_end(user):
    last_session = (
        StudySession.objects.filter(user=user)
        .exclude(status='Incomplete')
        .only('end_time')
        .first()
    )
    return last_session.end_time if last_session else None

def build_profile_completion(user):
    checkpoints = [
        {
            'id': 'photo_uploaded',
            'label': 'Photo uploaded',
            'complete': bool(user.profile_photo),
            'next_action': 'add a profile photo',
        },
        {
            'id': 'bio_written',
            'label': 'Bio written',
            'complete': bool((user.bio or '').strip()),
            'next_action': 'add a bio to stand out',
        },
        {
            'id': 'weekly_goal_set',
            'label': 'Weekly goal set',
            'complete': bool(user.weekly_goal_hours and user.weekly_goal_hours > 0),
            'next_action': 'set a weekly goal',
        },
        {
            'id': 'joined_three_societies',
            'label': '3+ societies joined',
            'complete': SocietyMembership.objects.filter(user=user).count() >= 3,
            'next_action': 'join 3 societies',
        },
        {
            'id': 'calendar_shared',
            'label': 'Calendar shared',
            'complete': CalendarShare.objects.filter(owner=user).exists(),
            'next_action': 'share your calendar',
        },
    ]
    completed = sum(1 for checkpoint in checkpoints if checkpoint['complete'])
    total = len(checkpoints)
    next_checkpoint = next((checkpoint for checkpoint in checkpoints if not checkpoint['complete']), None)
    return {
        'percentage': round((completed / total) * 100) if total else 100,
        'completed': completed,
        'total': total,
        'next_action': next_checkpoint['next_action'] if next_checkpoint else 'profile complete',
        'checkpoints': checkpoints,
    }

def build_profile_response(user, request):
    module_codes, module_count = get_module_data(user)
    event_counts = get_event_counts(user)
    user_data = UserSerialiser(user, context={'request': request}).data
    user_data.update(event_counts)
    user_data['module_count'] = module_count
    user_data['task_count'] = 0
    user_data['modules'] = module_codes
    user_data['last_session_end'] = get_last_session_end(user)
    user_data['profile_completion'] = build_profile_completion(user)
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
    if 'pinned_badge_id' in data:
        user.pinned_badge_id = str(data.get('pinned_badge_id') or '').strip()
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def suggest_study_session_view(request):
    target_user_id = request.data.get('target_user_id')
    if not target_user_id:
        return Response({'error': 'target_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        target_user = User.objects.get(id=int(target_user_id))
    except (ValueError, TypeError, User.DoesNotExist):
        return Response({'error': 'Target user not found'}, status=status.HTTP_404_NOT_FOUND)

    if target_user == request.user:
        return Response({'error': 'Cannot suggest a session to yourself'}, status=status.HTTP_400_BAD_REQUEST)

    slot_start = (request.data.get('slot_start') or '').strip()
    slot_end = (request.data.get('slot_end') or '').strip()
    custom_message = (request.data.get('message') or '').strip()

    if custom_message:
        message = custom_message
    elif slot_start and slot_end:
        message = (
            f"{request.user.username} suggested a study session from "
            f"{slot_start} to {slot_end}."
        )
    else:
        message = f"{request.user.username} suggested studying together this week."

    Notification.objects.create(
        user=target_user,
        title=f"Study session suggestion from {request.user.username}",
        message=message,
        notification_type='meeting_suggestion',
        action_url='calendar',
    )
    return Response({'message': 'Study session suggestion sent'}, status=status.HTTP_201_CREATED)
