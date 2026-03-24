"""
Service for expanding and serialising synced society calendar events.
"""

from studyFlax.models.society import SocietyCalendarSync, SocietyEvent
from studyFlax.serialisers.society.society_serialisers import get_society_color
from .recurrence_utils import is_time_overlap, next_society_occurrence, add_months, add_years

def add_month(dt):
    return add_months(dt, 1, max_day=28)

def add_year(dt):
    return add_years(dt, 1, max_day=28)

def get_synced_society_events(user, start_date=None, end_date=None):
    synced_ids = get_synced_society_ids(user)
    if not synced_ids:
        return []
    events = SocietyEvent.objects.filter(society_id__in=synced_ids).select_related('society', 'tag')
    return expand_and_serialize(events, start_date, end_date)

def get_synced_society_ids(user):
    return list(SocietyCalendarSync.objects.filter(user=user).values_list('society_id', flat=True))

def _expand_event(event, start_date, end_date):
    if event.recurrence and event.recurrence != 'none':
        return expand_recurring(event, start_date, end_date)
    return [serialize_event(event, 0)]

def expand_and_serialize(events, start_date, end_date):
    result = []
    for event in events:
        result.extend(_expand_event(event, start_date, end_date))
    return result

def _collect_instance(event, idx, current, duration, start_date, end_date):
    if is_in_range(current, duration, start_date, end_date):
        return [serialize_event(event, idx, current, current + duration)]
    return []

def expand_recurring(event, start_date, end_date):
    if not start_date or not end_date:
        return [serialize_event(event, 0)]
    instances = []
    duration = event.end_time - event.start_time
    current, idx = event.start_time, 0
    while should_continue(current, end_date, event.recurrence_end_date) and idx <= 365:
        instances.extend(_collect_instance(event, idx, current, duration, start_date, end_date))
        current = get_next_occurrence(current, event.recurrence)
        idx += 1
    return instances

def should_continue(current, end_date, recurrence_end):
    if current > end_date:
        return False
    if recurrence_end and current.date() > recurrence_end:
        return False
    return True

def is_in_range(start, duration, view_start, view_end):
    end = start + duration
    return is_time_overlap(start, end, view_start, view_end)

def get_next_occurrence(current, recurrence):
    return next_society_occurrence(current, recurrence)

def serialize_event(event, idx, start_override=None, end_override=None):
    return {
        'id': f"society_{event.society_id}_{event.id}_{idx}",
        'title': f"📢 {event.title}" if event.announcement else event.title,
        'description': event.description,
        'start_time': (start_override or event.start_time).isoformat(),
        'end_time': (end_override or event.end_time).isoformat(),
        'all_day': event.all_day,
        'location': event.location, 'source': 'society',
        'society_id': event.society_id,
        'society_name': event.society.name,
        'society_color': get_society_color(event.society_id),
        'tag_name': event.tag.label if event.tag else None,
        'tag_color': event.tag.color if event.tag else None,
        'announcement': event.announcement.id if event.announcement else None,
    }
