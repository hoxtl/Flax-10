"""
Orchestrates bulk creation of calendar events for all users.
"""

import random
from django.db import transaction

from studyFlax.models import CalendarEvent
from .seed_support.seed_event_helpers import (
    build_events_for_user, build_meal_events, build_today_afternoon_events,
    build_weekend_events,
)

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
    return events


@transaction.atomic
def create_events_for_users(users, tags, rules, stdout):
    """Create personal, meal, and afternoon events for all users."""
    all_events = []
    for user in users:
        all_events.extend(_build_all_user_events(user, tags, rules))
    CalendarEvent.objects.bulk_create(all_events, batch_size=500)
    stdout.write(f"  \u2713  {'Events':<14} {len(all_events):,}")
