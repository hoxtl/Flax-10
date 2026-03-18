"""
Attendance seeding for the seed management command.

Generates timetable CalendarEvents and EventAttendance records for
enrolled students across the teaching term, with per-user attendance
profiles that produce realistic chart data.
"""

import hashlib
import random
from datetime import datetime, timedelta, timezone as dt_timezone

from django.contrib.auth import get_user_model
from django.utils import timezone

from studyFlax.models import CalendarEvent, Enrollment
from studyFlax.models.calendar.event_attendance_model import EventAttendance
from studyFlax.fixtures.data_fixtures import lecture_theatre_fixtures

User = get_user_model()

_ATT_SEED_START = datetime(2026, 1, 15, tzinfo=dt_timezone.utc)
_ATT_READING_WEEK = (
    datetime(2026, 2, 23, tzinfo=dt_timezone.utc),
    datetime(2026, 2, 27, tzinfo=dt_timezone.utc),
)

_SESSION_TEMPLATES = [
    ("Lecture",       "Lecture: {module}",   "Weekly lecture session.",       2, "lgt"),
    ("Lecture",       "LGT: {module}",       "Large group teaching session.", 1, "lgt2"),
    ("Small group",   "SmG: {module}",       "Small group tutorial session.", 1, "smg"),
    ("Small group",   "Seminar: {module}",   "Interactive seminar session.",  1, "sem"),
    ("Practical/lab", "Practical: {module}", "Lab practical session.",        3, "prac"),
    ("Practical/lab", "Lab: {module}",       "Scheduled laboratory session.", 2, "lab"),
    ("Other",         "Briefing: {module}",  "Module briefing and Q&A.",      1, "brief"),
    ("Other",         "Workshop: {module}",  "Applied workshop session.",     2, "ws"),
]

_ATT_USER_PROFILES = {
    "johndoe": {"attend_rate": 0.90, "type_bias": {"Practical/lab": 0.98, "Lecture": 0.88}},
    "janedoe": {"attend_rate": 0.95, "type_bias": {"Lecture": 0.98, "Small group": 0.92}},
    "charlie": {"attend_rate": 0.82, "type_bias": {"Lecture": 0.75, "Other": 0.90}},
    "riley":   {"attend_rate": 0.88, "type_bias": {"Small group": 0.95, "Lecture": 0.85}},
    "nina":    {"attend_rate": 0.93, "type_bias": {}},
    "omar":    {"attend_rate": 0.78, "type_bias": {"Practical/lab": 0.95, "Lecture": 0.70}},
    "sofia":   {"attend_rate": 0.91, "type_bias": {"Small group": 0.97, "Other": 0.85}},
    "liamk":   {"attend_rate": 0.85, "type_bias": {"Lecture": 0.80, "Practical/lab": 0.95}},
}

_ATT_RANDOM_PROFILES = [
    {"attend_rate": 0.95, "type_bias": {}},
    {"attend_rate": 0.88, "type_bias": {"Lecture": 0.85}},
    {"attend_rate": 0.75, "type_bias": {"Practical/lab": 0.95, "Lecture": 0.68}},
    {"attend_rate": 0.82, "type_bias": {"Small group": 0.92}},
    {"attend_rate": 0.70, "type_bias": {}},
    {"attend_rate": 0.98, "type_bias": {}},
    {"attend_rate": 0.60, "type_bias": {"Practical/lab": 0.90}},
]


def _stable_hash(s):
    return int(hashlib.md5(s.encode()).hexdigest(), 16)

def _det_choice(items, seed_str):
    return items[_stable_hash(seed_str) % len(items)]

def _pick_session_indices(module_code, week_key):
    n = (_stable_hash(f"{module_code}{week_key}") % 3) + 2
    raw = sorted(set(
        _stable_hash(f"{module_code}{week_key}{i}") % len(_SESSION_TEMPLATES)
        for i in range(n * 3)
    ))
    return raw[:n]

def _assign_day(module_code, week_key, src_key, used_days):
    day_seed = f"{module_code}{week_key}{src_key}"
    day = _stable_hash(day_seed) % 5
    while day in used_days:
        day = (day + 1) % 5
    used_days.add(day)
    return day, day_seed

def _build_session_dict(template, module_code, week_start, day, day_seed):
    type_label, title_tmpl, desc, dur_h, src_key = template
    hour = _det_choice([9, 10, 11, 14, 15, 16], f"{day_seed}{day}")
    start = (week_start + timedelta(days=day)).replace(hour=hour, minute=0, second=0, microsecond=0)
    return {
        "title": title_tmpl.format(module=module_code),
        "description": desc,
        "start": start,
        "end": start + timedelta(hours=dur_h),
        "type_label": type_label,
        "source": "timetable",
        "external_id": f"{src_key}-{module_code}-{start.strftime('%Y%m%dT%H%M')}",
        "location": _det_choice(lecture_theatre_fixtures, f"{module_code}{src_key}"),
    }

def _week_sessions(module_code, week_start):
    """Return a list of session dicts for one module during one teaching week."""
    week_key = week_start.strftime("%Y%m%d")
    indices = _pick_session_indices(module_code, week_key)
    used_days = set()
    sessions = []
    for i in indices:
        template = _SESSION_TEMPLATES[i % len(_SESSION_TEMPLATES)]
        day, day_seed = _assign_day(module_code, week_key, template[4], used_days)
        sessions.append(_build_session_dict(template, module_code, week_start, day, day_seed))
    return sessions

def _is_reading_week(week_start):
    return _ATT_READING_WEEK[0] <= week_start <= _ATT_READING_WEEK[1]

def _get_user_profile(username):
    return _ATT_USER_PROFILES.get(username, random.choice(_ATT_RANDOM_PROFILES))

def _get_or_create_event(user, session):
    return CalendarEvent.objects.get_or_create(
        user=user, source=session['source'], external_id=session['external_id'],
        defaults={
            'title': session['title'], 'description': session['description'],
            'start_time': session['start'], 'end_time': session['end'],
            'location': session['location'], 'priority': 'high',
        },
    )

def _should_attend(username, session, profile):
    base = profile['attend_rate']
    adjusted = profile['type_bias'].get(session['type_label'], base)
    return (_stable_hash(f"{username}:{session['external_id']}") % 1000) / 1000.0 < adjusted

def _record_attendance(user, event, attended):
    return EventAttendance.objects.get_or_create(
        user=user, event=event, defaults={'attended': attended},
    )

def _past_sessions(module_code, week_start, now):
    return [s for s in _week_sessions(module_code, week_start) if s['start'] < now]

def _seed_single_session(user, session, profile):
    event, created = _get_or_create_event(user, session)
    attended = _should_attend(user.username, session, profile)
    _, att_new = _record_attendance(user, event, attended)
    return int(created), int(att_new)

def _seed_module_week(user, module_code, week_start, profile, now):
    """Seed events and attendance for one module in one week."""
    pairs = [_seed_single_session(user, s, profile) for s in _past_sessions(module_code, week_start, now)]
    return sum(ev for ev, _ in pairs), sum(at for _, at in pairs)

def _teaching_weeks(now):
    weeks_back = int((now - _ATT_SEED_START).days / 7)
    all_weeks = [_ATT_SEED_START + timedelta(weeks=w) for w in range(weeks_back + 1)]
    return [w for w in all_weeks if not _is_reading_week(w)]

def _enrolled_module_codes(user):
    return [e.module.module_code for e in Enrollment.objects.filter(student=user).select_related('module')]

def _seed_user_attendance(user, weeks, now):
    profile = _get_user_profile(user.username)
    pairs = [_seed_module_week(user, code, w, profile, now) for code in _enrolled_module_codes(user) for w in weeks]
    return sum(ev for ev, _ in pairs), sum(at for _, at in pairs)

def seed_attendance(stdout):
    """Create timetable events and attendance records for all enrolled students."""
    now = timezone.now()
    students = list(User.objects.filter(role='student'))
    weeks = _teaching_weeks(now)
    pairs = [_seed_user_attendance(user, weeks, now) for user in students]
    events_total = sum(ev for ev, _ in pairs)
    att_total = sum(at for _, at in pairs)
    stdout.write(f"  Created {events_total} timetable events and {att_total} attendance records.")
