"""
Module session event helpers for seeding timetable events.

Creates CalendarEvents for lectures, practicals, seminars, labs, etc.
linked to enrolled modules with proper tags.
"""

import hashlib
from datetime import datetime, timedelta, timezone as dt_timezone

from studyFlax.models import CalendarEvent
from studyFlax.fixtures.planning.data_fixtures import lecture_theatre_fixtures


SEED_START = datetime(2026, 1, 15, tzinfo=dt_timezone.utc)
SEED_END = datetime(2026, 6, 14, tzinfo=dt_timezone.utc)
READING_WEEK_START = datetime(2026, 2, 23).date()
READING_WEEK_END = datetime(2026, 2, 27).date()

# Session templates: (type_label, title_template, description, duration_hours, source_key)
MODULE_SESSION_TEMPLATES = [
    ("Lecture", "Lecture: {module}", "Weekly lecture session.", 2, "lgt"),
    ("Lecture", "LGT: {module}", "Large group teaching session.", 1, "lgt2"),
    ("Small group", "SmG: {module}", "Small group tutorial session.", 1, "smg"),
    ("Small group", "Seminar: {module}", "Interactive seminar session.", 1, "sem"),
    ("Practical/lab", "Practical: {module}", "Lab practical session.", 3, "prac"),
    ("Practical/lab", "Lab: {module}", "Scheduled laboratory session.", 2, "lab"),
    ("Other", "Briefing: {module}", "Module briefing and Q&A.", 1, "brief"),
    ("Other", "Workshop: {module}", "Applied workshop session.", 2, "ws"),
]


def _stable_hash(s):
    """Return a stable integer hash for deterministic randomness."""
    return int(hashlib.md5(s.encode()).hexdigest(), 16)

def _det_choice(items, seed_str):
    """Deterministically pick an item based on seed string."""
    return items[_stable_hash(seed_str) % len(items)]

def _pick_session_indices(module_code, week_key):
    """Return 2-4 deterministic session template indices for a module-week."""
    n = (_stable_hash(f"{module_code}{week_key}") % 3) + 2
    raw = sorted(set(
        _stable_hash(f"{module_code}{week_key}{i}") % len(MODULE_SESSION_TEMPLATES)
        for i in range(n * 3)
    ))
    return raw[:n]

def _assign_session_day(module_code, week_key, src_key, used_days):
    """Assign a weekday (0-4) avoiding duplicates within a week."""
    day_seed = f"{module_code}{week_key}{src_key}"
    day = _stable_hash(day_seed) % 5
    while day in used_days:
        day = (day + 1) % 5
    used_days.add(day)
    return day, day_seed

def _session_start_time(week_start, day, day_seed):
    """Calculate session start datetime."""
    hour = _det_choice([9, 10, 11, 14, 15, 16], f"{day_seed}{day}")
    return (week_start + timedelta(days=day)).replace(
        hour=hour, minute=0, second=0, microsecond=0
    )

def _build_session_dict(template, module, week_start, day, day_seed):
    """Build a session dict from template and scheduling info."""
    type_label, title_tmpl, desc, dur_h, src_key = template
    start = _session_start_time(week_start, day, day_seed)
    return {
        "title": title_tmpl.format(module=module.module_code),
        "description": desc,
        "start": start,
        "end": start + timedelta(hours=dur_h),
        "type_label": type_label,
        "source": "timetable",
        "external_id": f"{src_key}-{module.module_code}-{start.strftime('%Y%m%dT%H%M')}",
        "location": _det_choice(lecture_theatre_fixtures, f"{module.module_code}{src_key}"),
        "module": module,
    }

def _week_sessions(module, week_start):
    """Return a list of session dicts for one module during one teaching week."""
    week_key = week_start.strftime("%Y%m%d")
    indices = _pick_session_indices(module.module_code, week_key)
    used_days = set()
    sessions = []
    for i in indices:
        template = MODULE_SESSION_TEMPLATES[i % len(MODULE_SESSION_TEMPLATES)]
        day, day_seed = _assign_session_day(module.module_code, week_key, template[4], used_days)
        sessions.append(_build_session_dict(template, module, week_start, day, day_seed))
    return sessions

def _teaching_weeks(start_date, end_date, reading_start, reading_end):
    """Return list of teaching week start dates between start_date and end_date, excluding reading week."""
    total_weeks = int((end_date - start_date).days / 7) + 1
    all_weeks = [start_date + timedelta(weeks=w) for w in range(total_weeks)]
    return [w for w in all_weeks if not (reading_start <= w.date() <= reading_end)]

def session_tag(session, lecture_tag, schedule_tag):
    """Return Lecture tag for lectures, Schedule tag for other sessions."""
    return lecture_tag if session['type_label'] == 'Lecture' else schedule_tag

def build_session_event(user, session, tag):
    """Build an unsaved CalendarEvent for a module session."""
    return CalendarEvent(
        user=user,
        source=session['source'],
        external_id=session['external_id'],
        title=session['title'],
        description=session['description'],
        start_time=session['start'],
        end_time=session['end'],
        location=session['location'],
        priority='high',
        tag=tag,
        module=session['module'],
    )

def build_module_sessions(module, now):
    """Build all session dicts for a module across teaching weeks up to SEED_END."""
    weeks = _teaching_weeks(SEED_START, SEED_END, READING_WEEK_START, READING_WEEK_END)
    sessions = []
    for week in weeks:
        sessions.extend(_week_sessions(module, week))
    return sessions
