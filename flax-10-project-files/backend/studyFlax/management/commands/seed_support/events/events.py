"""
Orchestrates bulk creation of calendar events for all users.
"""

from collections import defaultdict
import random
from datetime import timedelta
from django.db import transaction

from studyFlax.models import CalendarEvent
from .event_helpers import (
    build_events_for_user, build_meal_events, build_today_afternoon_events,
    build_weekend_events,
)

MAX_SEEDED_EVENT_OVERLAPS = 2
SEED_EVENT_DAY_START_HOUR = 7
SEED_EVENT_DAY_END_HOUR = 23
SEED_EVENT_SLOT_STEP_MINUTES = 30


def _event_day(event):
    return event.start_time.date()


def _event_duration(event):
    duration = event.end_time - event.start_time
    return max(duration, timedelta(minutes=30))


def _event_sort_key(event):
    return (event.start_time, -_event_duration(event).total_seconds(), str(event.title or ""))


def _event_overlap(event, start_time, end_time):
    return event.start_time < end_time and event.end_time > start_time


def _fits_overlap_cap(start_time, end_time, existing_events):
    points = [(start_time, 1), (end_time, -1)]
    for event in existing_events:
        if not _event_overlap(event, start_time, end_time):
            continue
        points.append((event.start_time, 1))
        points.append((event.end_time, -1))
    active = 0
    for _, delta in sorted(points, key=lambda item: (item[0], 0 if item[1] == -1 else 1)):
        active += delta
        if active > MAX_SEEDED_EVENT_OVERLAPS:
            return False
    return True


def _candidate_slots(event, duration):
    day_start = event.start_time.replace(
        hour=SEED_EVENT_DAY_START_HOUR,
        minute=0,
        second=0,
        microsecond=0,
    )
    day_end = event.start_time.replace(
        hour=SEED_EVENT_DAY_END_HOUR,
        minute=0,
        second=0,
        microsecond=0,
    )
    starts = []
    cursor = day_start
    while cursor + duration <= day_end:
        starts.append(cursor)
        cursor += timedelta(minutes=SEED_EVENT_SLOT_STEP_MINUTES)
    starts.sort(
        key=lambda candidate: (
            abs((candidate - event.start_time).total_seconds()),
            candidate < event.start_time,
            candidate,
        )
    )
    return starts


def _rebalance_seeded_user_events(events):
    events_by_day = defaultdict(list)
    for event in sorted(events, key=_event_sort_key):
        day_events = events_by_day[_event_day(event)]
        duration = _event_duration(event)
        start_time = event.start_time
        end_time = event.end_time
        if not _fits_overlap_cap(start_time, end_time, day_events):
            for candidate in _candidate_slots(event, duration):
                candidate_end = candidate + duration
                if not _fits_overlap_cap(candidate, candidate_end, day_events):
                    continue
                start_time = candidate
                end_time = candidate_end
                break
        event.start_time = start_time
        event.end_time = end_time
        day_events.append(event)
    return events


def _seed_events_for_single_user(user, tags, rules):
    personal_events = build_events_for_user(user, tags, rules, 0)
    CalendarEvent.objects.bulk_create(personal_events)
    meal_events = build_meal_events(user, tags)
    CalendarEvent.objects.bulk_create(meal_events)
    today_events = build_today_afternoon_events(user, tags)
    CalendarEvent.objects.bulk_create(today_events)
    user_rng = random.Random(f"weekend-blocks:{user.username}")
    weekend_events = build_weekend_events(user, tags, user_rng)
    CalendarEvent.objects.bulk_create(weekend_events)
    return len(personal_events) + len(meal_events) + len(today_events) + len(weekend_events)

def _build_all_user_events(user, tags, rules):
    """Build all event types for a single user."""

    events = []
    events.extend(build_events_for_user(user, tags, rules, 0))
    events.extend(build_meal_events(user, tags))
    events.extend(build_today_afternoon_events(user, tags))
    return _rebalance_seeded_user_events(events)


@transaction.atomic
def create_events_for_users(users, tags, rules, stdout):
    """Create personal, meal, and afternoon events for all users."""

    all_events = []
    for user in users:
        all_events.extend(_build_all_user_events(user, tags, rules))
    CalendarEvent.objects.bulk_create(all_events, batch_size=500)
    stdout.write(f"  \u2713  {'Events':<14} {len(all_events):,}")
