"""
Provides overlap-aware slot helpers for seeded events.
"""

from datetime import timedelta


def event_day(event):
    return event.start_time.date()

def event_duration(event):
    """Return the event duration with a 30-minute minimum."""
    duration = event.end_time - event.start_time
    return max(duration, timedelta(minutes=30))

def event_sort_key(event):
    """Return a stable sort key for seeded events."""
    return (event.start_time, -event_duration(event).total_seconds(), str(event.title or ""))

def _event_overlap(event, start_time, end_time):
    """Return whether an event overlaps the proposed window."""
    return event.start_time < end_time and event.end_time > start_time

def _overlap_point_key(item):
    """Sort end points ahead of start points at the same time."""
    return (item[0], 0 if item[1] == -1 else 1)

def _overlap_points_for_event(event, start_time, end_time):
    """Return sweep points for one overlapping event."""
    if not _event_overlap(event, start_time, end_time):
        return []
    return [(event.start_time, 1), (event.end_time, -1)]

def _overlap_points(start_time, end_time, existing_events):
    """Return sweep points for a proposed window."""
    points = [(start_time, 1), (end_time, -1)]
    for event in existing_events:
        points.extend(_overlap_points_for_event(event, start_time, end_time))
    return points

def _active_counts(start_time, end_time, existing_events):
    """Yield active overlap counts during the sweep."""
    active = 0
    points = sorted(_overlap_points(start_time, end_time, existing_events), key=_overlap_point_key)
    for _, delta in points:
        active += delta
        yield active

def fits_overlap_cap(start_time, end_time, existing_events, max_overlaps):
    """Return whether the proposed window stays within the overlap cap."""
    return not next((True for active in _active_counts(start_time, end_time, existing_events) if active > max_overlaps), False)

def _day_boundary(event, hour):
    return event.start_time.replace(hour=hour, minute=0, second=0, microsecond=0)

def _slot_sort_key(candidate, event):
    """Return a stable slot ordering for candidate windows."""
    return (
        abs((candidate - event.start_time).total_seconds()),
        candidate < event.start_time,
        candidate,
    )

def candidate_slots(event, duration, day_start_hour, day_end_hour, step_minutes):
    """Return ordered slot candidates for an event duration."""
    day_start = _day_boundary(event, day_start_hour)
    day_end = _day_boundary(event, day_end_hour)
    starts = []
    cursor = day_start
    while cursor + duration <= day_end:
        starts.append(cursor)
        cursor += timedelta(minutes=step_minutes)
    starts.sort(key=lambda candidate: _slot_sort_key(candidate, event))
    return starts
