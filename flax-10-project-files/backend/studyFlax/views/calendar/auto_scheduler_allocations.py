"""
Auto scheduler allocation helpers.
"""

from datetime import timedelta

from django.utils import timezone

from studyFlax.models import CalendarEvent, ScheduleEventAllocation

from .auto_scheduler_windows import _is_allowed_day, _resolve_window
from .system_tags import get_schedule_tag


def _find_first_gap(busy_slots, start, end, duration):
    required = timedelta(minutes=duration)
    return _find_gap_in_slots(list(busy_slots), start, end, required)

def _find_gap_in_slots(busy_slots, current, end, required):
    if not busy_slots:
        return (current, current + required) if end - current >= required else (None, None)
    busy_start, busy_end = busy_slots[0]
    gap = _gap_before_busy_slot(current, busy_start, busy_end, required)
    if gap:
        return gap
    return _find_gap_in_slots(busy_slots[1:], _next_gap_cursor(current, busy_end), end, required)

def _gap_before_busy_slot(current, busy_start, busy_end, required):
    if busy_end <= current:
        return None
    if busy_start - current < required:
        return None
    return current, current + required

def _next_gap_cursor(current, busy_end):
    return max(current, busy_end)

def _busy_slots_for_day(user, start, end):
    events = CalendarEvent.objects.filter(user=user, start_time__lt=end, end_time__gt=start)
    return [(event.start_time, event.end_time) for event in events.order_by("start_time")]

def _create_auto_event(user, deadline, start, end, minutes, schedule, tag):
    event = CalendarEvent.objects.create(
        user=user,
        title=f"Study: {deadline.title}",
        description=f"Auto-scheduled block for {deadline.title}",
        start_time=start,
        end_time=end,
        source="auto_scheduler",
        tag=tag,
    )
    ScheduleEventAllocation.objects.create(schedule=schedule, event=event, deadline=deadline, allocated_minutes=minutes)

def _allocate_for_deadline(user, deadline, day_start, day_end, minutes, schedule, tag):
    if _deadline_before_window(deadline, day_start) or minutes <= 0:
        return 0
    gap_start, gap_end = _find_first_gap(_busy_slots_for_day(user, day_start, day_end), day_start, day_end, minutes)
    if not gap_start:
        return 0
    _create_auto_event(user, deadline, gap_start, gap_end, minutes, schedule, tag)
    return minutes

def _deadline_before_window(deadline, day_start):
    return timezone.localtime(deadline.start_due_date).date() < day_start.date()

def _process_day_allocation(day, user, deadlines, deadline_map, prefs, schedule, tag):
    if not _is_allowed_day(day, prefs["week_preference"]):
        return
    window_start, window_end = _aware_window(day, prefs)
    remaining = _window_budget(user, window_start, window_end)
    for deadline in deadlines:
        requested = min(deadline_map[deadline.id], remaining)
        remaining -= _allocate_for_deadline(user, deadline, window_start, window_end, requested, schedule, tag)

def _aware_window(day, prefs):
    window_start, window_end = _resolve_window(day, prefs["wake_time"], prefs["sleep_time"], prefs["worktime_preference"])
    return timezone.make_aware(window_start), timezone.make_aware(window_end)

def _window_budget(user, window_start, window_end):
    if window_end <= window_start:
        return 0
    minutes = int((window_end - window_start).total_seconds() // 60)
    return min(_daily_budget_minutes(user), minutes)

def _allocate_deadline_blocks(schedule, user, deadlines, deadline_map, prefs):
    tag = get_schedule_tag()
    current_day = timezone.localtime(timezone.now()).date()
    last_day = max(timezone.localtime(deadline.start_due_date).date() for deadline in deadlines)
    while current_day <= last_day:
        _process_day_allocation(current_day, user, deadlines, deadline_map, prefs, schedule, tag)
        current_day += timedelta(days=1)

def _daily_budget_minutes(user):
    settings = getattr(user, "settings", None)
    value = getattr(settings, "preferred_study_minutes_per_day", 120)
    return max(1, int(value))
