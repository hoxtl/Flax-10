from datetime import datetime, timedelta, time
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from studyFlax.models import CalendarEvent, Deadline, Schedule, ScheduleEventAllocation
from studyFlax.serialisers import AutoScheduleRequestSerialiser, ScheduleSerialiser
from .system_tags import get_schedule_tag
from .schedule_helpers import _overwrite_same_name_schedules

def _resolved_preferences(user, payload):
    s = getattr(user, 'settings', None)
    return {
        'wake_time': payload.get('wake_time') or getattr(s, 'wake_time', None),
        'sleep_time': payload.get('sleep_time') or getattr(s, 'sleep_time', None),
        'week_preference': payload.get('week_preference') or getattr(s, 'week_preference', None),
        'worktime_preference': payload.get('worktime_preference') or getattr(s, 'worktime_preference', None),
    }

def _get_base_window(day, wake, sleep):
    if not (wake and sleep):
        return datetime.combine(day, time(0, 0)), datetime.combine(day + timedelta(days=1), time(0, 0))
    start = datetime.combine(day, wake)
    end = datetime.combine(day, sleep)
    if end <= start: end += timedelta(days=1)
    return start, end

def _apply_worktime_pref(start, end, day, pref):
    if pref == 'day':
        return max(start, datetime.combine(day, time(8, 0))), min(end, datetime.combine(day, time(18, 0)))
    if pref == 'night':
        return max(start, datetime.combine(day, time(18, 0))), min(end, datetime.combine(day + timedelta(days=1), time(2, 0)))
    return start, end

def _resolve_window(day, wake, sleep, pref):
    start, end = _get_base_window(day, wake, sleep)
    return _apply_worktime_pref(start, end, day, pref)

def _is_allowed_day(day, pref):
    if pref == 'both': return True
    is_we = day.weekday() >= 5
    return is_we if pref == 'weekends' else not is_we

def _find_first_gap(busy, start, end, duration):
    curr, req = start, timedelta(minutes=duration)
    for b_s, b_e in busy:
        if b_e <= curr: continue
        if b_s - curr >= req: return curr, curr + req
        curr = max(curr, b_e)
    return (curr, curr + req) if end - curr >= req else (None, None)

def _busy_slots_for_day(user, start, end):
    busy = CalendarEvent.objects.filter(user=user, start_time__lt=end, end_time__gt=start).order_by('start_time')
    return [(e.start_time, e.end_time) for e in busy]

def _validate_auto_request(request):
    ser = AutoScheduleRequestSerialiser(data=request.data)
    if not ser.is_valid(): return None, None, Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    p = ser.validated_data
    d_map = {i['deadline_id']: i['ideal_minutes_per_day'] for i in p['deadline_preferences']}
    deadlines = list(Deadline.objects.filter(id__in=d_map.keys(), module__enrollments__student=request.user, start_due_date__gte=timezone.now()).distinct().order_by('start_due_date'))
    if len(deadlines) != len(d_map):
        return None, None, Response({'detail': 'Invalid deadlines.'}, status=status.HTTP_400_BAD_REQUEST)
    return p, d_map, deadlines

def _create_auto_event(user, deadline, start, end, minutes, schedule, tag):
    event = CalendarEvent.objects.create(
        user=user, title=f"Study: {deadline.title}",
        description=f"Auto-scheduled block for {deadline.title}",
        start_time=start, end_time=end, source='auto_scheduler', tag=tag
    )
    ScheduleEventAllocation.objects.create(schedule=schedule, event=event, deadline=deadline, allocated_minutes=minutes)

def _allocate_for_deadline(user, deadline, d_minutes, window, schedule, tag, budget):
    if timezone.localtime(deadline.start_due_date).date() < window[0].date() or budget <= 0:
        return 0
    alloc = min(d_minutes, budget)
    busy = _busy_slots_for_day(user, window[0], window[1])
    b_s, b_e = _find_first_gap(busy, window[0], window[1], alloc)
    if b_s:
        _create_auto_event(user, deadline, b_s, b_e, alloc, schedule, tag)
        return alloc
    return 0

def _process_day_allocation(day, user, deadlines, d_map, prefs, schedule, tag, budget):
    if not _is_allowed_day(day, prefs['week_preference']): return
    w_s, w_e = _resolve_window(day, prefs['wake_time'], prefs['sleep_time'], prefs['worktime_preference'])
    w_s, w_e = timezone.make_aware(w_s), timezone.make_aware(w_e)
    if w_e <= w_s: return
    rem = min(budget, int((w_e - w_s).total_seconds() // 60))
    for d in deadlines:
        rem -= _allocate_for_deadline(user, d, d_map[d.id], (w_s, w_e), schedule, tag, rem)

def _allocate_deadline_blocks(schedule, user, deadlines, d_map, prefs):
    tag = get_schedule_tag()
    curr = timezone.localtime(timezone.now()).date()
    end = max(timezone.localtime(d.start_due_date).date() for d in deadlines)
    budget = _daily_budget_minutes(user)
    while curr <= end:
        _process_day_allocation(curr, user, deadlines, d_map, prefs, schedule, tag, budget)
        curr += timedelta(days=1)

def build_auto_schedule(request):
    p, d_map, ds = _validate_auto_request(request)
    if isinstance(ds, Response): return ds
    prefs = _resolved_preferences(request.user, p)
    with transaction.atomic():
        if p.get('clear_existing'): request.user.schedules.all().delete()
        ovr = _overwrite_same_name_schedules(request.user, p['title'])
        sch = Schedule.objects.create(title=p['title'], user=request.user, **prefs)
        sch.deadline.set(ds)
        _allocate_deadline_blocks(sch, request.user, ds, d_map, prefs)
    res = ScheduleSerialiser(sch).data
    res['overwritten'] = ovr
    return Response(res, status=status.HTTP_201_CREATED)

def _daily_budget_minutes(user):
    s = getattr(user, 'settings', None)
    return max(1, int(getattr(s, 'preferred_study_minutes_per_day', 120)))
