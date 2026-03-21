"""
Orchestrates bulk creation of calendar events for all users.
"""

from django.db import transaction

from studyFlax.models import CalendarEvent
from .seed_event_helpers import (
    build_events_for_user, build_meal_events, build_today_afternoon_events,
)


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
    stdout.write("Seeding events for users...")
    all_events = []
    for user in users:
        all_events.extend(_build_all_user_events(user, tags, rules))
    CalendarEvent.objects.bulk_create(all_events, batch_size=500)
    stdout.write(f"  Created {len(all_events):,} events across {len(users)} users.")
