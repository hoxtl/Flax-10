"""
Orchestrates bulk creation of calendar events for all users.
"""

import random
from studyFlax.models import CalendarEvent
from .seed_event_helpers import (
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

def create_events_for_users(users, tags, rules, stdout):
    stdout.write("Seeding events for users...")
    total = 0
    for i, user in enumerate(users):
        print(f"  Processing user {i+1}/{len(users)}: {user.username}", end='\r')
        total += _seed_events_for_single_user(user, tags, rules)
    print(f"  Created {total} events across {len(users)} users.          ")
