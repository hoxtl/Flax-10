from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.serialisers.auth_serialisers import UserSerialiser
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models.modules.enrollmentModel import Enrollment
from studyFlax.models import User
from datetime import timedelta
from django.utils import timezone


def get_module_data(user):
    """Gets module codes and count from enrollments."""
    enrollments = Enrollment.objects.filter(student=user).select_related('module')
    module_codes = sorted([e.module.module_code for e in enrollments])
    return module_codes, len(module_codes)


def get_event_counts(user):
    """Gets event counts by time range."""
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
    """Builds the full profile response dict."""
    module_codes, module_count = get_module_data(user)
    event_counts = get_event_counts(user)

    user_data = UserSerialiser(user, context={'request': request}).data
    user_data.update(event_counts)
    user_data['module_count'] = module_count
    user_data['task_count'] = 0
    user_data['modules'] = module_codes

    return user_data


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    if request.method == 'GET':
        return Response(build_profile_response(request.user, request))

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
        return Response(build_profile_response(user, request))