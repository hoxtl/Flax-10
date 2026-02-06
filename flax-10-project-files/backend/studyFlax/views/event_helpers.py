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
    instances = [event]
    if not event.recurrence_rule or not start_date or not end_date:
        return instances
    
    rule = event.recurrence_rule
    current = event.start_time
    duration = event.end_time - event.start_time
    delta = get_timedelta(rule.frequency, rule.interval)
    max_occurrences = rule.count or 365
    
    for count in range(max_occurrences):
        current = add_instance_if_valid(instances, event, current, delta, duration, start_date, end_date, rule)
        if current is None:
            break
    
    return instances

def add_instance_if_valid(instances, event, current, delta, duration, start_date, end_date, rule):
    current += delta
    if should_stop_generating(current, end_date, rule):
        return None
    if current >= start_date:
        instances.append(create_instance(event, current, duration))
    return current

def should_stop_generating(current, end_date, rule):
    if current > end_date:
        return True
    if rule.end_date and current.date() > rule.end_date:
        return True
    return False

def get_timedelta(frequency, interval):
    deltas = {'daily': timedelta(days=interval), 'weekly': timedelta(weeks=interval),
              'monthly': timedelta(days=30 * interval), 'yearly': timedelta(days=365 * interval)}
    return deltas.get(frequency, timedelta(days=1))

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