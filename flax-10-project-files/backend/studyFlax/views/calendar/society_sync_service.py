from datetime import timedelta, datetime
from studyFlax.models.society import SocietyCalendarSync, SocietyEvent
from studyFlax.serialisers.society_serialisers import get_society_color


def get_synced_society_events(user, start_date=None, end_date=None):
    """Get all society events from societies the user has synced."""
    synced_ids = get_synced_society_ids(user)
    if not synced_ids:
        return []
    events = SocietyEvent.objects.filter(society_id__in=synced_ids).select_related('society', 'tag')
    return expand_and_serialize(events, start_date, end_date)


def get_synced_society_ids(user):
    return list(SocietyCalendarSync.objects.filter(user=user).values_list('society_id', flat=True))


def expand_and_serialize(events, start_date, end_date):
    result = []
    for event in events:
        if event.recurrence and event.recurrence != 'none':
            result.extend(expand_recurring(event, start_date, end_date))
        else:
            result.append(serialize_event(event, 0))
    return result


def expand_recurring(event, start_date, end_date):
    if not start_date or not end_date:
        return [serialize_event(event, 0)]

    instances = []
    duration = event.end_time - event.start_time
    current = event.start_time
    idx = 0

    while should_continue(current, end_date, event.recurrence_end_date):
        if is_in_range(current, duration, start_date, end_date):
            instances.append(serialize_event(event, idx, current, current + duration))
        current = get_next_occurrence(current, event.recurrence)
        idx += 1
        if idx > 365:
            break
    return instances


def should_continue(current, end_date, recurrence_end):
    if current > end_date:
        return False
    if recurrence_end and current.date() > recurrence_end:
        return False
    return True


def is_in_range(start, duration, view_start, view_end):
    end = start + duration
    return start < view_end and end > view_start


def get_next_occurrence(current, recurrence):
    if recurrence == 'daily':
        return current + timedelta(days=1)
    if recurrence == 'weekly':
        return current + timedelta(weeks=1)
    if recurrence == 'biweekly':
        return current + timedelta(weeks=2)
    if recurrence == 'monthly':
        return add_month(current)
    if recurrence == 'yearly':
        return add_year(current)
    return current + timedelta(days=365)


def add_month(dt):
    month = dt.month + 1
    year = dt.year + (month - 1) // 12
    month = ((month - 1) % 12) + 1
    day = min(dt.day, 28)
    return dt.replace(year=year, month=month, day=day)


def add_year(dt):
    try:
        return dt.replace(year=dt.year + 1)
    except ValueError:
        return dt.replace(year=dt.year + 1, day=28)


def serialize_event(event, idx, start_override=None, end_override=None):
    return {
        'id': f"society_{event.society_id}_{event.id}_{idx}",
        'title': event.title,
        'description': event.description,
        'start_time': (start_override or event.start_time).isoformat(),
        'end_time': (end_override or event.end_time).isoformat(),
        'location': event.location,
        'source': 'society',
        'society_id': event.society_id,
        'society_name': event.society.name,
        'society_color': get_society_color(event.society_id),
        'tag_name': event.tag.label if event.tag else None,
        'tag_color': event.tag.color if event.tag else None,
        'announcement': event.announcement.id if event.announcement else None,
    }
