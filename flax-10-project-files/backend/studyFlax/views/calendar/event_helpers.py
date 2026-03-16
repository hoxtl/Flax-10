"""
Helper functions for calendar event filtering, expansion, and overlap checking.
"""

from django.db.models import Q
from datetime import datetime, timedelta, timezone
from itertools import takewhile
import calendar
import types

def filter_events_by_date_range(queryset, params):
    start = params.get('start')
    end = params.get('end')
    if not (start or end): return queryset
    
    recurring = Q(recurrence_rule__isnull=False)
    return apply_filter(queryset, start, end, recurring)

def _apply_start_end_filter(qs, start, end, rec_q, non_rec):
    in_range = Q(start_time__lte=end) & Q(end_time__gte=start)
    if rec_q is not None:
        return qs.filter((non_rec & in_range) | (rec_q & Q(start_time__lte=end)))
    return qs.filter(non_rec & in_range)

def _apply_start_only_filter(qs, start, rec_q):
    if rec_q is not None:
        return qs.filter(Q(end_time__gte=start) | rec_q)
    return qs.filter(end_time__gte=start)

def apply_filter(qs, start, end, rec_q):
    non_rec = Q(recurrence_rule__isnull=True)
    if start and end:
        return _apply_start_end_filter(qs, start, end, rec_q, non_rec)
    if start:
        return _apply_start_only_filter(qs, start, rec_q)
    return qs.filter(start_time__lte=end)

def _expand_event(event, start_date, end_date):
    if event.recurrence_rule:
        return generate_instances(event, start_date, end_date)
    return [event]

def expand_recurring_events(events, start_date=None, end_date=None):
    expanded = []
    for event in events:
        expanded.extend(_expand_event(event, start_date, end_date))
    return expanded

def generate_instances(event, view_start, view_end):
    if not (view_start and view_end): return [event]
    
    instances = []
    add_base_instance(instances, event, view_start, view_end)
    add_future_occurrences(instances, event, view_start, view_end)
    return instances

def add_base_instance(instances, event, v_start, v_end):
    if is_base_valid(event, v_start, v_end):
        dur = event.end_time - event.start_time
        instances.append(create_instance(event, event.start_time, dur, 0))

def is_base_valid(event, v_start, v_end):
    if is_exception(event.start_time, event.recurrence_rule): return False
    return is_time_overlap(event.start_time, event.end_time, v_start, v_end)

def add_future_occurrences(instances, event, v_start, v_end):
    rule = event.recurrence_rule
    dur = event.end_time - event.start_time
    all_pairs = ((calc_occurrence(event.start_time, rule, i), i) for i in range(1, (rule.count or 1000) + 1))
    in_range = takewhile(lambda x: not stop_generation(x[0], v_end, rule), all_pairs)
    instances.extend(create_instance(event, dt, dur, i) for dt, i in in_range if is_occurrence_valid(dt, dur, v_start, v_end, rule))

def stop_generation(dt, v_end, rule):
    if not dt: return False
    if dt > v_end: return True
    if rule.end_date and dt.date() > rule.end_date: return True
    return False

def is_occurrence_valid(dt, dur, v_start, v_end, rule):
    if not dt: return False
    if is_exception(dt, rule): return False
    return is_time_overlap(dt, dt + dur, v_start, v_end)

def is_time_overlap(e_start, e_end, v_start, v_end):
    return e_start < v_end and e_end > v_start

def is_exception(dt, rule):
    if not rule.exception_dates: return False
    return dt.strftime('%Y-%m-%d') in rule.exception_dates

def calc_occurrence(start, rule, num):
    delta = rule.interval * num
    freq = rule.frequency
    
    if freq == 'daily': return start + timedelta(days=delta)
    if freq == 'weekly': return start + timedelta(weeks=delta)
    if freq == 'monthly': return add_months(start, delta)
    if freq == 'yearly': return add_years(start, delta)
    return None

def add_months(dt, months):
    m = dt.month + months
    y = dt.year + (m - 1) // 12
    m = ((m - 1) % 12) + 1
    d = min(dt.day, calendar.monthrange(y, m)[1])
    return dt.replace(year=y, month=m, day=d)

def add_years(dt, years):
    try: return dt.replace(year=dt.year + years)
    except ValueError: return dt.replace(year=dt.year + years, day=28)

def create_instance(base, start, dur, idx):
    return types.SimpleNamespace(
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

def parse_date_param(ds):
    return datetime.fromisoformat(ds.replace('Z', '+00:00')) if ds else None
def get_next_occurrence(start, frequency, interval, num):
    class FakeRule:
        pass
    rule = FakeRule()
    rule.frequency = frequency
    rule.interval = interval
    return calc_occurrence(start, rule, num)

def is_exception_date(dt, rule):
    return is_exception(dt, rule)

def should_stop_generating(current, end_date, rule):
    return stop_generation(current, end_date, rule)

def get_base_instance(event, rule):
    if is_exception(event.start_time, rule):
        return []
    return [event]
