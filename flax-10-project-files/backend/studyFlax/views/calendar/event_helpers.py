"""
Helpers for calendar event filtering, expansion, and overlap checking.
"""

from datetime import datetime
from itertools import takewhile

from django.db.models import Q
from types import SimpleNamespace

<<<<<<< HEAD
from django.utils import timezone
from .recurrence_utils import add_months as _add_months, add_years as _add_years, calc_occurrence as _calc_occurrence, is_time_overlap


MAX_SIMULTANEOUS_OVERLAPS = 2

def filter_events_by_date_range(queryset, params):
    start = parse_date_param(params.get('start'))
    end = parse_date_param(params.get('end'))
=======
from .recurrence_utils import add_months as _add_months, add_years as _add_years, calc_occurrence as _calc_occurrence, is_time_overlap

MAX_SIMULTANEOUS_OVERLAPS = 3

def filter_events_by_date_range(queryset, params):
    start = params.get('start')
    end = params.get('end')
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    if not (start or end):
        return queryset
    recurring = Q(recurrence_rule__isnull=False)
    return apply_filter(queryset, start, end, recurring)

def _apply_start_end_filter(qs, start, end, recurring_qs, non_recurring_qs):
    overlap = Q(start_time__lte=end) & Q(end_time__gte=start)
    base = non_recurring_qs & overlap
    if recurring_qs is not None:
        return qs.filter(base | (recurring_qs & Q(start_time__lte=end)))
    return qs.filter(base)

def _apply_start_only_filter(qs, start, recurring_qs, non_recurring_qs):
    base = Q(end_time__gte=start)
    if recurring_qs is not None:
        return qs.filter(base | recurring_qs)
    return qs.filter(base)

def apply_filter(qs, start, end, recurring_qs):
    non_recurring_qs = Q(recurrence_rule__isnull=True)
    if start and end:
        return _apply_start_end_filter(qs, start, end, recurring_qs, non_recurring_qs)
    if start:
        return _apply_start_only_filter(qs, start, recurring_qs, non_recurring_qs)
    return qs.filter(non_recurring_qs & Q(start_time__lte=end))

def expand_recurring_events(events, start_date=None, end_date=None):
    expanded = []
    for event in events:
        expanded.extend(_expand_event(event, start_date, end_date))
    return expanded

def _expand_event(event, start_date, end_date):
    if event.recurrence_rule:
        return generate_instances(event, start_date, end_date)
    return [event]

def generate_instances(event, view_start, view_end):
    if not (view_start and view_end):
        return [event]
    instances = []
    _add_base_if_visible(instances, event, view_start, view_end)
    instances.extend(_future_instances(event, view_start, view_end))
    return instances

def _add_base_if_visible(instances, event, view_start, view_end):
    if _is_instance_visible(event.start_time, event.end_time, view_start, view_end, event.recurrence_rule):
        duration = event.end_time - event.start_time
        instances.append(_build_instance(event, event.start_time, duration, 0))

def _future_instances(event, view_start, view_end):
    rule = event.recurrence_rule
    duration = event.end_time - event.start_time
    pairs = ((calc_occurrence(event.start_time, rule, i), i) for i in range(1, (rule.count or 1000) + 1))
    in_range = takewhile(lambda item: not _should_stop_generation(item[0], view_end, rule), pairs)
    return [
        _build_instance(event, start, duration, i)
        for start, i in in_range
        if _is_occurrence_visible(start, duration, view_start, view_end, rule)
    ]

def _should_stop_generation(start, view_end, rule):
<<<<<<< HEAD
    """Return whether should stop generation."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    if start is None:
        return True
    if start > view_end:
        return True
    if rule.end_date and start.date() > rule.end_date:
        return True
    return False

def _is_instance_visible(start, end, view_start, view_end, rule):
    if is_exception(start, rule):
        return False
    return is_time_overlap(start, end, view_start, view_end)

def _is_occurrence_visible(start, duration, view_start, view_end, rule):
    if start is None:
        return False
    if is_exception(start, rule):
        return False
    return is_time_overlap(start, start + duration, view_start, view_end)

def is_exception(dt, rule):
    if not rule.exception_dates:
        return False
    return dt.strftime('%Y-%m-%d') in rule.exception_dates

def calc_occurrence(start, rule, num):
    return _calc_occurrence(start, rule.frequency, rule.interval, num, monthly_max_day=28)

def add_months(dt, months):
    return _add_months(dt, months)

def add_years(dt, years):
    return _add_years(dt, years)

def _build_instance(base, start, dur, idx):
    return SimpleNamespace(
        id=int(base.id) * 10000 + idx, title=base.title,
        description=base.description,
        start_time=start, end_time=start + dur,
        location=base.location,
        tag=base.tag,
        recurrence_rule=base.recurrence_rule,
        reminder_minutes=base.reminder_minutes,
        module=base.module,
        is_private=getattr(base, 'is_private', False),
        source=getattr(base, 'source', None),
        external_id=getattr(base, 'external_id', None),
    )

def check_event_overlap(user, data):
    s, e = data['start_time'], data['end_time']
    return user.events.filter(start_time__lt=e, end_time__gt=s).exists()

def overlap_count(user, start_time, end_time, exclude_id=None):
    qs = user.events.filter(start_time__lt=end_time, end_time__gt=start_time)
    if exclude_id:
        qs = qs.exclude(id=exclude_id)
    return qs.count()

def exceeds_overlap_limit(user, start_time, end_time, exclude_id=None):
    return overlap_count(user, start_time, end_time, exclude_id) >= MAX_SIMULTANEOUS_OVERLAPS

def parse_date_param(ds):
<<<<<<< HEAD
    if not ds:
        return None
    dt = datetime.fromisoformat(ds.replace('Z', '+00:00'))
    if timezone.is_naive(dt):
        return timezone.make_aware(dt)
    return dt
=======
    return datetime.fromisoformat(ds.replace('Z', '+00:00')) if ds else None
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

def get_next_occurrence(start, frequency, interval, num):
    rule = SimpleNamespace(frequency=frequency, interval=interval)
    return calc_occurrence(start, rule, num)

def is_exception_date(dt, rule):
    return is_exception(dt, rule)

def should_stop_generating(current, end_date, rule):
<<<<<<< HEAD
    """Return whether should stop generating."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    return _should_stop_generation(current, end_date, rule)

def get_base_instance(event, rule):
    if is_exception(event.start_time, rule):
        return []
    return [event]
