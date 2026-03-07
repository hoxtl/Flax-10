from datetime import datetime, timedelta, time
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from studyFlax.models import CalendarEvent, Deadline, Schedule, Notification, ScheduleEventAllocation
from studyFlax.serialisers import AutoScheduleRequestSerialiser, ScheduleSerialiser


def _resolve_window(current_day, preferred_start, preferred_end, worktime_preference):
    if preferred_start and preferred_end:
        return (
            datetime.combine(current_day, preferred_start),
            datetime.combine(current_day, preferred_end),
        )
    if worktime_preference == 'day':
        return datetime.combine(current_day, time(8, 0)), datetime.combine(current_day, time(20, 0))
    if worktime_preference == 'night':
        return datetime.combine(current_day, time(20, 0)), datetime.combine(current_day + timedelta(days=1), time(2, 0))
    return datetime.combine(current_day, time(8, 0)), datetime.combine(current_day, time(23, 0))


def _is_allowed_day(current_day, week_preference):
    if week_preference == 'both':
        return True
    is_weekend = current_day.weekday() >= 5
    return is_weekend if week_preference == 'weekends' else not is_weekend


def _find_first_gap(busy_slots, window_start, window_end, duration_minutes):
    current = window_start
    required = timedelta(minutes=duration_minutes)
    for busy_start, busy_end in busy_slots:
        if busy_end <= current:
            continue
        if busy_start - current >= required:
            return current, current + required
        if busy_start <= current < busy_end:
            current = busy_end
    if window_end - current >= required:
        return current, current + required
    return None, None


def _busy_slots_for_day(user, day_start, day_end):
    busy = CalendarEvent.objects.filter(
        user=user,
        start_time__lt=day_end,
        end_time__gt=day_start,
    ).order_by('start_time')
    return [(event.start_time, event.end_time) for event in busy]


def build_auto_schedule(request):
    serialiser = AutoScheduleRequestSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

    payload = serialiser.validated_data
    deadline_map = {item['deadline_id']: item['ideal_minutes_per_day'] for item in payload['deadline_preferences']}
    deadlines = list(
        Deadline.objects.filter(
            id__in=deadline_map.keys(),
            module__enrollments__student=request.user,
            start_due_date__gte=timezone.now(),
        ).distinct().order_by('start_due_date')
    )

    if len(deadlines) != len(deadline_map):
        return Response({'detail': 'One or more deadlines are invalid for this user.'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        if payload.get('clear_existing'):
            request.user.schedules.all().delete()

        overwritten = _overwrite_same_name_schedules(request.user, payload['title'])
        schedule = Schedule.objects.create(
            title=payload['title'],
            user=request.user,
            preferred_start_time=payload.get('preferred_start_time'),
            preferred_end_time=payload.get('preferred_end_time'),
            worktime_preference=payload['worktime_preference'],
            week_preference=payload['week_preference'],
        )
        schedule.deadline.set(deadlines)

        for deadline in deadlines:
            _allocate_deadline_blocks(schedule, request.user, deadline, deadline_map[deadline.id], payload)

    response_payload = ScheduleSerialiser(schedule).data
    response_payload['overwritten'] = overwritten
    return Response(response_payload, status=status.HTTP_201_CREATED)


def _allocate_deadline_blocks(schedule, user, deadline, minutes_per_day, payload):
    start_date = timezone.localtime(timezone.now()).date()
    end_date = timezone.localtime(deadline.start_due_date).date()
    current_day = start_date

    while current_day <= end_date:
        if not _is_allowed_day(current_day, payload['week_preference']):
            current_day += timedelta(days=1)
            continue

        window_start, window_end = _resolve_window(
            current_day,
            payload.get('preferred_start_time'),
            payload.get('preferred_end_time'),
            payload['worktime_preference'],
        )

        if timezone.is_naive(window_start):
            window_start = timezone.make_aware(window_start)
        if timezone.is_naive(window_end):
            window_end = timezone.make_aware(window_end)

        if window_end <= window_start:
            window_end = window_end + timedelta(days=1)

        busy = _busy_slots_for_day(user, window_start, window_end)
        block_start, block_end = _find_first_gap(busy, window_start, window_end, minutes_per_day)

        if block_start and block_end:
            event = CalendarEvent.objects.create(
                user=user,
                title=f"Study: {deadline.title}",
                description=f"Auto-scheduled work block for {deadline.title}",
                start_time=block_start,
                end_time=block_end,
                source='auto_scheduler',
            )
            ScheduleEventAllocation.objects.create(
                schedule=schedule,
                event=event,
                deadline=deadline,
                allocated_minutes=minutes_per_day,
            )

        current_day += timedelta(days=1)

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
