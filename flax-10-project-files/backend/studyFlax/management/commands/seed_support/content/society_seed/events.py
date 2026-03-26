"""
Event creation for seeded society records.
"""

import random
from datetime import date

from studyFlax.fixtures.planning.data_fixtures import location_fixtures
from studyFlax.fixtures.societies.society_fixtures import build_event_datetime
from studyFlax.models import Society, SocietyEvent
from .catalogue import get_society_seed_lookup

SOCIETY_RECURRENCE_END = date(2026, 6, 30)


def _build_event_defaults(description, start, end, recurrence, tags):
    return {
        "description": description,
        "location": random.choice(location_fixtures),
        "start_time": start,
        "end_time": end,
        "recurrence": recurrence or "none",
        "recurrence_end_date": SOCIETY_RECURRENCE_END if recurrence else None,
        "tag": random.choice(tags) if tags else None,
    }


def _create_event_from_template(society, template, tags):
    title, description, hour, duration, recurrence, day = template
    start, end = build_event_datetime(hour, duration, day)
    SocietyEvent.objects.get_or_create(
        society=society,
        title=title,
        defaults=_build_event_defaults(description, start, end, recurrence, tags),
    )


def _seed_events_for_society(society, seed_lookup):
    config = seed_lookup.get(society.name)
    if not config:
        return
    tags = list(society.tags.all())
    for event_template in config.get("events", []):
        _create_event_from_template(society, event_template, tags)


def create_society_events(stdout):
    """Create events for all seeded societies."""

    del stdout
    seed_lookup = get_society_seed_lookup()
    for society in Society.objects.all():
        _seed_events_for_society(society, seed_lookup)
