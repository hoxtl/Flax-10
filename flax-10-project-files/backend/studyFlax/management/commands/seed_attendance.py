"""
Attendance seeding for the seed management command.

Creates EventAttendance records for existing timetable CalendarEvents,
using per-user attendance profiles for realistic chart data.
"""

import hashlib
import random

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from studyFlax.models import CalendarEvent
from studyFlax.models.calendar.event_attendance_model import EventAttendance

User = get_user_model()

_USER_PROFILES = {
    "johndoe": {"attend_rate": 0.90, "type_bias": {"Practical/lab": 0.98, "Lecture": 0.88}},
    "janedoe": {"attend_rate": 0.95, "type_bias": {"Lecture": 0.98, "Small group": 0.92}},
    "charlie": {"attend_rate": 0.82, "type_bias": {"Lecture": 0.75, "Other": 0.90}},
    "amiller": {"attend_rate": 0.97, "type_bias": {"Lecture": 0.99, "Small group": 0.95}},
}

_RANDOM_PROFILES = [
    {"attend_rate": 0.95, "type_bias": {}},
    {"attend_rate": 0.88, "type_bias": {"Lecture": 0.85}},
    {"attend_rate": 0.75, "type_bias": {"Practical/lab": 0.95, "Lecture": 0.68}},
    {"attend_rate": 0.82, "type_bias": {"Small group": 0.92}},
    {"attend_rate": 0.70, "type_bias": {}},
    {"attend_rate": 0.98, "type_bias": {}},
    {"attend_rate": 0.60, "type_bias": {"Practical/lab": 0.90}},
]

_TITLE_TYPE_MAP = {
    "Lecture:": "Lecture",
    "LGT:": "Lecture",
    "SmG:": "Small group",
    "Seminar:": "Small group",
    "Practical:": "Practical/lab",
    "Lab:": "Practical/lab",
    "Briefing:": "Other",
    "Workshop:": "Other",
}


def _stable_hash(s):
    """Return a stable integer hash for deterministic randomness."""
    return int(hashlib.md5(s.encode()).hexdigest(), 16)


def _get_user_profile(username):
    """Return attendance profile for a user."""
    return _USER_PROFILES.get(username, random.choice(_RANDOM_PROFILES))


def _event_type_label(title):
    """Infer session type from event title prefix."""
    return next((label for prefix, label in _TITLE_TYPE_MAP.items() if title.startswith(prefix)), "Other")


def _should_attend(username, event, profile):
    """Determine if user attended based on profile and event type."""
    base = profile['attend_rate']
    type_label = _event_type_label(event.title)
    adjusted = profile['type_bias'].get(type_label, base)
    seed_str = f"{username}:{event.external_id or event.id}"
    return (_stable_hash(seed_str) % 1000) / 1000.0 < adjusted


def _build_attendance_record(user, event, attended):
    """Build an unsaved EventAttendance record."""
    return EventAttendance(user=user, event=event, attended=attended)


def _build_user_attendance(user, events, profile):
    """Build attendance records for a user's events."""
    return [
        _build_attendance_record(user, event, _should_attend(user.username, event, profile))
        for event in events
    ]


def _fetch_all_timetable_events(students, now):
    """Fetch all past timetable events for all students."""
    return CalendarEvent.objects.filter(
        user__in=students,
        source='timetable',
        start_time__lt=now,
    ).select_related('user')


def _group_events_by_user(events):
    """Group events by user ID."""
    by_user = {}
    for event in events:
        by_user.setdefault(event.user_id, []).append(event)
    return by_user


@transaction.atomic
def seed_attendance(stdout):
    """Create attendance records for all students' timetable events."""
    now = timezone.now()
    students = list(User.objects.filter(role='student'))
    events = _fetch_all_timetable_events(students, now)
    events_by_user = _group_events_by_user(events)
    all_records = []
    for user in students:
        profile = _get_user_profile(user.username)
        user_events = events_by_user.get(user.id, [])
        all_records.extend(_build_user_attendance(user, user_events, profile))
    EventAttendance.objects.bulk_create(all_records, ignore_conflicts=True, batch_size=500)
    stdout.write(f"  \u2713  {'Attendance':<14} {len(all_records):,}")
    stdout.write("")
