from studyFlax.models import CalendarEvent, Notification, Schedule, ScheduleEventAllocation
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.serialisers import ScheduleSerialiser
from .auto_scheduler_views import build_auto_schedule
from django.db import transaction
from .system_tags import get_schedule_tag
from django.db.models import Q

def _schedule_queryset(user):
    return Schedule.objects.filter(user=user).prefetch_related('event_allocations__event', 'deadline')


def _events_for_manual_schedule(user, event_ids):
    schedule_tag = get_schedule_tag()
    return list(
        CalendarEvent.objects.filter(
            user=user,
            id__in=event_ids,
        ).filter(
            Q(tag=schedule_tag) | Q(tag__name__iexact='schedule')
        ).order_by('start_time')
    )


def _notify_schedule_overwrite(user, title):
    Notification.objects.create(
        user=user,
        title='Schedule overwritten',
        message=f'Your previous schedule "{title}" has been overwritten by a newer one.',
        notification_type='general',
    )


def _overwrite_same_name_schedules(user, title):
    existing = list(Schedule.objects.filter(user=user, title=title))
    if not existing:
        return False

    for schedule in existing:
        schedule.delete()
    _notify_schedule_overwrite(user, title)
    return True


def _build_manual_schedule(request):
    title = (request.data.get('title') or '').strip()
    if not title:
        return Response({'detail': 'title is required for manual schedules.'}, status=status.HTTP_400_BAD_REQUEST)

    requested_event_ids = request.data.get('event_ids') or []
    if not isinstance(requested_event_ids, list) or not requested_event_ids:
        return Response({'detail': 'event_ids must be a non-empty list.'}, status=status.HTTP_400_BAD_REQUEST)

    events = _events_for_manual_schedule(request.user, requested_event_ids)
    if len(events) != len(set(requested_event_ids)):
        return Response(
            {'detail': 'One or more events are invalid or not tagged as schedule.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        overwritten = _overwrite_same_name_schedules(request.user, title)
        schedule = Schedule.objects.create(
            title=title,
            user=request.user,
            worktime_preference='both',
            week_preference='both',
        )
        allocations = [
            ScheduleEventAllocation(
                schedule=schedule,
                event=event,
                allocated_minutes=max(1, int((event.end_time - event.start_time).total_seconds() // 60)),
            )
            for event in events
        ]
        ScheduleEventAllocation.objects.bulk_create(allocations)

    serialised = ScheduleSerialiser(schedule).data
    serialised['overwritten'] = overwritten
    return Response(serialised, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def schedule_list(request):
    if request.method == 'GET':
        schedules = _schedule_queryset(request.user)
        return Response(ScheduleSerialiser(schedules, many=True).data)

    if request.data.get('mode') == 'manual':
        return _build_manual_schedule(request)

    return build_auto_schedule(request)


@api_view(['GET', 'DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def schedule_detail(request, schedule_id):
    schedule = get_object_or_404(_schedule_queryset(request.user), id=schedule_id)
    if request.method == 'GET':
        return Response(ScheduleSerialiser(schedule).data)

    if request.method == 'PATCH':
        title = (request.data.get('title') or '').strip()
        if not title:
            return Response({'detail': 'title is required.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if schedule.title != title:
                overwritten = _overwrite_same_name_schedules(request.user, title)
            else:
                overwritten = False
            schedule.title = title
            schedule.save(update_fields=['title', 'updated_at'])

        payload = ScheduleSerialiser(schedule).data
        payload['overwritten'] = overwritten
        return Response(payload)

    schedule.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
