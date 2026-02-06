from django.db.models import Q
from datetime import datetime, timedelta

def filter_events_by_date_range(queryset, params):
    start = params.get('start')
    end = params.get('end')
    if not start and not end:
        return queryset

    recurring = Q(recurrence_rule__isnull=False)
    non_recurring = Q(recurrence_rule__isnull=True)

    if start and end:
        non_recurring_in_range = non_recurring & Q(start_time__lte=end) & Q(end_time__gte=start)
        recurring_could_expand = recurring & Q(start_time__lte=end)
        return queryset.filter(non_recurring_in_range | recurring_could_expand)
    if start:
        return queryset.filter(Q(end_time__gte=start) | recurring)
    return queryset.filter(start_time__lte=end)

def check_event_overlap(user, event_data):
    start = event_data['start_time']
    end = event_data['end_time']
    
    overlapping = user.events.filter(Q(start_time__lt=end) & Q(end_time__gt=start))
    return overlapping.exists()

def parse_date_param(date_string):
    if not date_string:
        return None
    return datetime.fromisoformat(date_string.replace('Z', '+00:00'))

def expand_recurring_events(events, start_date=None, end_date=None):
    expanded = []
    for event in events:
        expanded.extend(process_event_recurrence(event, start_date, end_date))
    return expanded

def process_event_recurrence(event, start_date, end_date):
    if not event.recurrence_rule:
        return [event]
    return generate_instances(event, start_date, end_date)

def generate_instances(event, start_date, end_date):
    if not event.recurrence_rule or not start_date or not end_date:
        return [event]

    rule = event.recurrence_rule
    instances = get_base_instance(event, rule)
    duration = event.end_time - event.start_time
    max_occurrences = rule.count or 365

    for i in range(1, max_occurrences + 1):
        next_start = get_next_occurrence(event.start_time, rule.frequency, rule.interval, i)
        if next_start is None or should_stop_generating(next_start, end_date, rule):
            break
        if next_start >= start_date and not is_exception_date(next_start, rule):
            instances.append(create_instance(event, next_start, duration))

    return instances

def get_base_instance(event, rule):
    if is_exception_date(event.start_time, rule):
        return []
    return [event]

def get_next_occurrence(start, frequency, interval, occurrence_num):
    if frequency == 'daily':
        return start + timedelta(days=interval * occurrence_num)
    if frequency == 'weekly':
        return start + timedelta(weeks=interval * occurrence_num)
    if frequency == 'monthly':
        return add_months(start, interval * occurrence_num)
    if frequency == 'yearly':
        return add_years(start, interval * occurrence_num)
    return None

def add_months(dt, months):
    new_month = dt.month + months
    new_year = dt.year + (new_month - 1) // 12
    new_month = ((new_month - 1) % 12) + 1
    new_day = min(dt.day, get_days_in_month(new_year, new_month))
    return dt.replace(year=new_year, month=new_month, day=new_day)

def add_years(dt, years):
    new_year = dt.year + years
    new_day = min(dt.day, get_days_in_month(new_year, dt.month))
    return dt.replace(year=new_year, day=new_day)

def get_days_in_month(year, month):
    import calendar
    return calendar.monthrange(year, month)[1]

def is_exception_date(date, rule):
    if not rule.exception_dates:
        return False
    date_str = date.strftime('%Y-%m-%d')
    return date_str in rule.exception_dates

def should_stop_generating(current, end_date, rule):
    if current > end_date:
        return True
    if rule.end_date and current.date() > rule.end_date:
        return True
    return False

def create_instance(event, start, duration):
    class EventInstance:
        def __init__(self, base_event, new_start, dur):
            # Create a unique integer ID by combining event ID with timestamp hash
            timestamp_hash = hash(new_start.isoformat()) % 1000000
            self.id = int(f"{base_event.id}{timestamp_hash:06d}")
            self.title = base_event.title
            self.description = base_event.description
            self.start_time = new_start
            self.end_time = new_start + dur
            self.location = base_event.location
            self.tag = base_event.tag
            self.recurrence_rule = base_event.recurrence_rule
            self.reminder_minutes = base_event.reminder_minutes
    return EventInstance(event, start, duration)