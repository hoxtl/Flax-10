"""
Profile payload and patch helpers for user profile endpoints.
"""

from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from studyFlax.models import User
from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.models.modules.enrollment_model import Enrollment
from studyFlax.models.modules.module_model import Module
from studyFlax.models.social.share_model import CalendarShare
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.models.timer.session_model import StudySession
from studyFlax.serialisers.authentication.authentication_serialisers import UserSerialiser


def get_module_data(user):
    taught_modules = Module.objects.filter(created_by=user).only('module_code')
    if getattr(user, 'role', None) == 'teacher' or taught_modules.exists():
        return serialise_module_codes(taught_modules)
    enrollments = Enrollment.objects.filter(student=user).select_related('module')
    return serialise_module_codes([enrollment.module for enrollment in enrollments])

def serialise_module_codes(modules):
    module_codes = sorted([module.module_code for module in modules])
    return module_codes, len(module_codes)

def get_event_counts(user):
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    all_events = CalendarEvent.objects.filter(user=user)
    return {
        'event_count': all_events.filter(start_time__gte=now).count(),
        'events_today': count_events_between(all_events, today_start, today_start + timedelta(days=1)),
        'events_week': count_events_between(all_events, now, today_start + timedelta(days=7)),
        'events_month': count_events_between(all_events, now, today_start + timedelta(days=30)),
    }

def count_events_between(events, start_time, end_time):
    return events.filter(start_time__gte=start_time, start_time__lt=end_time).count()

def get_last_session_end(user):
    last_session = StudySession.objects.filter(user=user).exclude(status='Incomplete').only('end_time').first()
    return last_session.end_time if last_session else None

def build_profile_completion(user):
    checkpoints = get_profile_checkpoints(user)
    completed = sum(1 for checkpoint in checkpoints if checkpoint['complete'])
    total = len(checkpoints)
    next_checkpoint = next((checkpoint for checkpoint in checkpoints if not checkpoint['complete']), None)
    return build_completion_response(checkpoints, completed, total, next_checkpoint)

def get_profile_checkpoints(user):
    return [
        build_checkpoint('photo_uploaded', 'Photo uploaded', bool(user.profile_photo), 'add a profile photo'),
        build_checkpoint('bio_written', 'Bio written', bool((user.bio or '').strip()), 'add a bio to stand out'),
        build_checkpoint('weekly_goal_set', 'Weekly goal set', bool(user.weekly_goal_hours and user.weekly_goal_hours > 0), 'set a weekly goal'),
        build_checkpoint('joined_three_societies', '3+ societies joined', SocietyMembership.objects.filter(user=user).count() >= 3, 'join 3 societies'),
        build_checkpoint('calendar_shared', 'Calendar shared', CalendarShare.objects.filter(owner=user).exists(), 'share your calendar'),
    ]

def build_checkpoint(checkpoint_id, label, complete, next_action):
    return {'id': checkpoint_id, 'label': label, 'complete': complete, 'next_action': next_action}

def build_completion_response(checkpoints, completed, total, next_checkpoint):
    return {
        'percentage': round((completed / total) * 100) if total else 100,
        'completed': completed,
        'total': total,
        'next_action': next_checkpoint['next_action'] if next_checkpoint else 'profile complete',
        'checkpoints': checkpoints,
    }

def build_profile_response(user, request):
    module_codes, module_count = get_module_data(user)
    user_data = UserSerialiser(user, context={'request': request}).data
    user_data.update(get_event_counts(user))
    user_data.update({'module_count': module_count, 'task_count': 0, 'modules': module_codes})
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
    apply_profile_fields(user, data, files)
    user.save()
    return None

def apply_profile_fields(user, data, files):
    if 'weekly_goal_hours' in data:
        user.weekly_goal_hours = int(data['weekly_goal_hours'])
    if 'bio' in data:
        user.bio = data['bio']
    if 'pinned_badge_id' in data:
        user.pinned_badge_id = str(data.get('pinned_badge_id') or '').strip()
    update_photo(user, data, files)
