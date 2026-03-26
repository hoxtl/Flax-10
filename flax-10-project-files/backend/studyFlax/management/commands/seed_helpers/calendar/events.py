"""
Orchestrates seeded calendar events for all users.
"""

from collections import defaultdict
import random
from django.db import transaction

from studyFlax.models import CalendarEvent
from .event_helpers import (
    build_events_for_user, build_meal_events, build_today_afternoon_events,
    build_weekend_events,
)
from .overlap_utils import candidate_slots, event_day, event_duration, event_sort_key, fits_overlap_cap


MAX_SEEDED_EVENT_OVERLAPS = 2
SEED_EVENT_DAY_START_HOUR = 7
SEED_EVENT_DAY_END_HOUR = 23
SEED_EVENT_SLOT_STEP_MINUTES = 30


def _candidate_window(candidate, duration):
    """Return the start and end time for a candidate slot."""
    return candidate, candidate + duration

def _slot_candidates(event, duration):
    """Return ordered slot candidates for one event."""
    return candidate_slots(
        event,
        duration,
        SEED_EVENT_DAY_START_HOUR,
        SEED_EVENT_DAY_END_HOUR,
        SEED_EVENT_SLOT_STEP_MINUTES,
    )

def _candidate_window_if_available(candidate, duration, day_events):
    """Return a candidate window when it fits the overlap cap."""
    start_time, end_time = _candidate_window(candidate, duration)
    if not fits_overlap_cap(start_time, end_time, day_events, MAX_SEEDED_EVENT_OVERLAPS):
        return None
    return start_time, end_time

def _available_windows(event, duration, day_events):
    """Yield valid windows for one event."""
    return (
        _candidate_window_if_available(candidate, duration, day_events)
        for candidate in _slot_candidates(event, duration)
    )

def _event_window(event, day_events):
    """Return the scheduled window for one event."""
    start_time = event.start_time
    end_time = event.end_time
    if fits_overlap_cap(start_time, end_time, day_events, MAX_SEEDED_EVENT_OVERLAPS):
        return start_time, end_time
    duration = event_duration(event)
    return next((window for window in _available_windows(event, duration, day_events) if window), (start_time, end_time))

def _rebalance_seeded_user_events(events):
    """Rebalance seeded personal events within each day."""
    events_by_day = defaultdict(list)
    for event in sorted(events, key=event_sort_key):
        day_events = events_by_day[event_day(event)]
        start_time, end_time = _event_window(event, day_events)
        event.start_time = start_time
        event.end_time = end_time
        day_events.append(event)
    return events

def _build_all_user_events(user, tags, rules):
    events = []
    events.extend(build_events_for_user(user, tags, rules, 0))
    events.extend(build_meal_events(user, tags))
    events.extend(build_today_afternoon_events(user, tags))
    user_rng = random.Random(f"weekend-blocks:{user.username}")
    events.extend(build_weekend_events(user, tags, user_rng))
    return _rebalance_seeded_user_events(events)

@transaction.atomic
def create_events_for_users(users, tags, rules, stdout):
    """Create personal, meal, and afternoon events for all users."""
    all_events = []
    for user in users:
        all_events.extend(_build_all_user_events(user, tags, rules))
    CalendarEvent.objects.bulk_create(all_events, batch_size=500)
    stdout.write(f"  \u2713  {'Events':<14} {len(all_events):,}")
