from django.db.models import Q
from datetime import datetime, timedelta, timezone
import calendar

def filter_events_by_date_range(queryset, params):
    start = params.get('start')
    end = params.get('end')
    if not (start or end): return queryset
    
    recurring = Q(recurrence_rule__isnull=False)
    return apply_filter(queryset, start, end, recurring)

def apply_filter(qs, start, end, rec_q):
    non_rec = Q(recurrence_rule__isnull=True)
    if start and end:
        in_range = Q(start_time__lte=end) & Q(end_time__gte=start)
        if rec_q is not None:
            return qs.filter((non_rec & in_range) | (rec_q & Q(start_time__lte=end)))
        return qs.filter(non_rec & in_range)
    if start:
        if rec_q is not None:
            return qs.filter(Q(end_time__gte=start) | rec_q)
        return qs.filter(end_time__gte=start)
    return qs.filter(start_time__lte=end)

def expand_recurring_events(events, start_date=None, end_date=None):
    expanded = []
    for event in events:
        if event.recurrence_rule:
            expanded.extend(generate_instances(event, start_date, end_date))
        else:
            expanded.append(event)
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
    limit = rule.count or 1000
    
    for i in range(1, limit + 1):
        dt = calc_occurrence(event.start_time, rule, i)
        if stop_generation(dt, v_end, rule): break
        
        if is_occurrence_valid(dt, dur, v_start, v_end, rule):
            instances.append(create_instance(event, dt, dur, i))

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
    class Evt:
        def __init__(self):
            self.id = int(base.id) * 10000 + idx
            self.title = base.title
            self.description = base.description
            self.start_time = start
            self.end_time = start + dur
            self.location = base.location
            self.tag = base.tag
            self.recurrence_rule = base.recurrence_rule
            self.reminder_minutes = base.reminder_minutes
            self.module = base.module
            self.is_private = getattr(base, 'is_private', False)
            self.source = getattr(base, 'source', None)
            self.external_id = getattr(base, 'external_id', None)
    return Evt()

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
