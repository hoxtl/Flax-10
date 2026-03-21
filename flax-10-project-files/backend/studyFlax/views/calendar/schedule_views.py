"""
Schedule CRUD views.
"""

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models import CalendarEvent, Schedule, ScheduleEventAllocation
from studyFlax.serialisers import ScheduleSerialiser

from .auto_scheduler_views import build_auto_schedule
from .system_tags import get_schedule_tag
from .schedule_helpers import _overwrite_same_name_schedules, _schedule_queryset

def _events_for_manual_schedule(user, event_ids):
    schedule_tag = get_schedule_tag()
    return list(
        CalendarEvent.objects.filter(user=user, id__in=event_ids)
        .filter(Q(tag=schedule_tag) | Q(tag__name__iexact='schedule'))
        .order_by('start_time')
    )

def _validate_manual_request(request):
    title = (request.data.get('title') or '').strip()
    if not title:
        return None, Response({'detail': 'title is required for manual schedules.'}, status=status.HTTP_400_BAD_REQUEST)
    requested_event_ids = request.data.get('event_ids') or []
    if not isinstance(requested_event_ids, list) or not requested_event_ids:
        return None, Response({'detail': 'event_ids must be a non-empty list.'}, status=status.HTTP_400_BAD_REQUEST)
    return title, None

def _create_manual_allocations(schedule, events):
    allocations = [
        ScheduleEventAllocation(
            schedule=schedule,
            event=event,
            allocated_minutes=max(1, int((event.end_time - event.start_time).total_seconds() // 60)),
        )
        for event in events
    ]
    ScheduleEventAllocation.objects.bulk_create(allocations)

def _create_manual_schedule_atomic(user, title, events):
    with transaction.atomic():
        overwritten = _overwrite_same_name_schedules(user, title)
        schedule = Schedule.objects.create(
            title=title,
            user=user,
            worktime_preference='both',
            week_preference='both',
        )
        _create_manual_allocations(schedule, events)
    return schedule, overwritten

def _build_manual_schedule(request):
    title, error_resp = _validate_manual_request(request)
    if error_resp: return error_resp
    
    events = _events_for_manual_schedule(request.user, request.data.get('event_ids'))
    if len(events) != len(set(request.data.get('event_ids'))):
        return Response({'detail': 'One or more events are invalid or not tagged as schedule.'}, status=status.HTTP_400_BAD_REQUEST)

    schedule, overwritten = _create_manual_schedule_atomic(request.user, title, events)
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

def _handle_schedule_patch(request, schedule):
    title = (request.data.get('title') or '').strip()
    if not title:
        return Response({'detail': 'title is required.'}, status=status.HTTP_400_BAD_REQUEST)
    with transaction.atomic():
        ovr = _overwrite_same_name_schedules(request.user, title) if schedule.title != title else False
        schedule.title = title
        schedule.save(update_fields=['title', 'updated_at'])
    payload = ScheduleSerialiser(schedule).data
    payload['overwritten'] = ovr
    return Response(payload)

@api_view(['GET', 'DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def schedule_detail(request, schedule_id):
    schedule = get_object_or_404(_schedule_queryset(request.user), id=schedule_id)
    if request.method == 'GET':
        return Response(ScheduleSerialiser(schedule).data)
    if request.method == 'PATCH':
        return _handle_schedule_patch(request, schedule)
    schedule.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
