"""
Factories for building calendar events, lectures, meals and deadlines.
"""

import random
from datetime import datetime, timedelta, timezone as dt_timezone

from django.utils import timezone

from studyFlax.models import CalendarEvent, Deadline
from studyFlax.fixtures.data_fixtures import (
    event_title_fixtures, description_fixtures,
    location_fixtures, lecture_theatre_fixtures,
    breakfast_fixtures, lunch_fixtures, dinner_fixtures,
    module_deadline_fixtures, deadline_fixtures,
    get_course_prefixes,
)

SEED_START = datetime(2026, 1, 15, 0, 0, 0, tzinfo=dt_timezone.utc)
SEED_DAYS = 365

READING_WEEK_START = datetime(2026, 2, 23).date()
READING_WEEK_END = datetime(2026, 2, 27).date()

AFTERNOON_SLOTS = [
    (12, 30, 30, "Review notes"),
    (18, 30, 45, "Study at library"),
    (21, 0, 30, "Plan tomorrow"),
]

MEAL_SPECS = [
    ("Breakfast", breakfast_fixtures, 8, 0, 8, 30),
    ("Lunch", lunch_fixtures, 12, 30, 13, 15),
    ("Dinner", dinner_fixtures, 19, 0, 19, 45),
]

def _in_reading_week(dt):
    d = dt.date() if hasattr(dt, 'date') else dt
    return READING_WEEK_START <= d <= READING_WEEK_END

ACADEMIC_TAG_NAMES = {'Lecture', 'Exam', 'Deadline'}


def _personal_tags(user, tags):
    """Return non-academic tags for personal events."""
    user_tags = [t for t in tags if t.user_id == user.id or t.is_default]
    return [t for t in user_tags if t.name not in ACADEMIC_TAG_NAMES]


WEEKEND_BLOCK_SPECS = [
    (10, 0, 90, "Gym session"),
    (11, 0, 60, "Brunch with friends"),
    (14, 0, 120, "Study session"),
    (15, 30, 60, "Errands"),
    (11, 30, 90, "Football practice"),
    (16, 0, 60, "Library visit"),
    (9, 30, 60, "Morning run"),
    (13, 0, 90, "Part-time work"),
    (17, 0, 90, "Family dinner"),
    (10, 30, 120, "Volunteering"),
    (12, 0, 60, "Grocery shopping"),
    (15, 0, 90, "Gaming with friends"),
]

def build_event(user, title, tags, day_offset, hour):
    """Construct a single unsaved CalendarEvent for *user*."""
    start = SEED_START.replace(hour=hour, minute=0, second=0) + timedelta(days=day_offset)
    duration = random.choice([60, 90, 120])
    personal = _personal_tags(user, tags)
    tag = random.choice(personal) if personal and random.random() > 0.2 else None
    return CalendarEvent(
        user=user,
        title=title,
        description=random.choice(description_fixtures) if random.random() > 0.3 else "",
        start_time=start,
        end_time=start + timedelta(minutes=duration),
        location=random.choice(location_fixtures) if random.random() > 0.7 else None,
        tag=tag,
        priority=random.choice(['low', 'medium', 'high', 'urgent']),
        recurrence_rule=None,
    )

def _fresh_week_titles():
    titles = list(event_title_fixtures)
    random.shuffle(titles)
    return titles

def _pop_title(week_titles):
    if not week_titles:
        week_titles.extend(_fresh_week_titles())
    return week_titles.pop()

def _build_day_events(user, tags, day_offset, week_titles):
    non_lecture_hours = [8, 13, 17, 19, 20]
    daily_count = random.randint(1, 2)
    hours = random.sample(non_lecture_hours, min(daily_count, len(non_lecture_hours)))
    return [build_event(user, _pop_title(week_titles), tags, day_offset, h) for h in hours]

def _refresh_titles_if_new_week(day_offset, current_week, week_titles):
    week = day_offset // 7
    if week != current_week:
        week_titles.clear()
        week_titles.extend(_fresh_week_titles())
        return week
    return current_week

def build_events_for_user(user, tags, rules, count):
    """Return unsaved CalendarEvents spread across the seed date range."""
    events = []
    week_titles = []
    current_week = -1
    for day_offset in range(SEED_DAYS):
        current_week = _refresh_titles_if_new_week(day_offset, current_week, week_titles)
        events.extend(_build_day_events(user, tags, day_offset, week_titles))
    return events

def _make_aware(dt):
    return timezone.make_aware(dt) if dt.tzinfo is None else dt

def _afternoon_event(user, today, hour, minute, duration_min, title, tag):
    start = _make_aware(today.replace(hour=hour, minute=minute, second=0, microsecond=0))
    end = start + timedelta(minutes=duration_min)
    return CalendarEvent(
        user=user, title=title, description="",
        start_time=start, end_time=end, tag=tag,
        priority=random.choice(['low', 'medium', 'high']),
        recurrence_rule=None,
    )

def build_today_afternoon_events(user, tags):
    """Five mock events for today between 14:30 and 20:00."""
    now = timezone.now()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    personal = _personal_tags(user, tags)
    tag = random.choice(personal) if personal else None
    return [_afternoon_event(user, today, h, m, d, t, tag) for h, m, d, t in AFTERNOON_SLOTS]

def _meal_event(user, base, day_offset, label, fixtures, sh, sm, eh, em, tag):
    return CalendarEvent(
        user=user, title=label,
        description=fixtures[day_offset % len(fixtures)],
        start_time=base.replace(hour=sh, minute=sm, second=0, microsecond=0),
        end_time=base.replace(hour=eh, minute=em, second=0, microsecond=0),
        source="personal", tag=tag, recurrence_rule=None,
    )

def _meal_events_for_day(user, day_offset, tag):
    base = SEED_START + timedelta(days=day_offset)
    return [_meal_event(user, base, day_offset, *spec, tag) for spec in MEAL_SPECS]

def _find_tag_by_name(user_tags, name):
    """Find a tag by name in a list of tags."""
    return next((t for t in user_tags if t.name == name), None)


def _resolve_meal_tag(user, tags):
    """Find Meals or Other tag for meal events."""
    user_tags = [t for t in tags if t.user_id == user.id or t.is_default]
    return _find_tag_by_name(user_tags, 'Meals') or _find_tag_by_name(user_tags, 'Other') or (user_tags[0] if user_tags else None)

def build_meal_events(user, tags):
    """Meals (Breakfast, Lunch, Dinner) use Meals/Routine/Wellness tags."""
    meal_tag = _resolve_meal_tag(user, tags)
    events = []
    for day_offset in range(SEED_DAYS):
        events.extend(_meal_events_for_day(user, day_offset, meal_tag))
    return events

def _first_weekday_from(start_dt, weekday):
    days_ahead = (weekday - start_dt.weekday()) % 7
    return start_dt + timedelta(days=days_ahead)

def build_module_event(code, name, description, admin, weekly_rule):
    """Return a dict of Module field values for a weekly recurring lecture."""
    weekday = random.randint(0, 4)
    hour = random.choice([9, 10, 11, 14, 15, 16])
    first_lecture = _first_weekday_from(SEED_START, weekday).replace(
        hour=hour, minute=0, second=0,
    )
    return dict(
        module_code=code, module_name=name, description=description,
        created_by=admin, start_time=first_lecture,
        end_time=first_lecture + timedelta(hours=2),
        location=random.choice(lecture_theatre_fixtures),
        recurrence_rule=weekly_rule,
    )

def get_user_modules(user, all_modules):
    """Return (core_modules, extra_modules) matched to the user's declared major.

    Each student is enrolled in 5-7 modules: primarily from their major,
    with a couple of electives from other departments for variety.
    """
    major = getattr(getattr(user, 'settings', None), 'major', None)
    prefixes = get_course_prefixes(major)
    matched = [m for m in all_modules if any(m.module_code.startswith(p) for p in prefixes)]
    others = [m for m in all_modules if m not in matched]
    rng = random.Random(hash(user.username))
    target = rng.randint(5, 7)
    rng.shuffle(matched)
    core_count = min(len(matched), max(4, target - 1))
    core = matched[:core_count]
    extra_count = target - len(core)
    rng.shuffle(others)
    extras = others[:extra_count] if extra_count > 0 else []
    return core, extras

def create_lecture_event(user, module, start, end, lecture_tag):
    """Create or fetch the CalendarEvent representing one lecture occurrence."""
    CalendarEvent.objects.get_or_create(
        user=user,
        title=f"Lecture: {module.module_name}",
        start_time=start,
        defaults={
            'end_time': end,
            'location': module.location,
            'description': module.module_name,
            'tag': lecture_tag,
            'priority': 'high',
            'recurrence_rule': None,
            'module': module,
            'source': 'module_enrollment',
        },
    )

def _weekly_candidates(start, max_weeks=52):
    return [start + timedelta(weeks=w) for w in range(max_weeks)]

def build_lecture_events(user, module, lecture_tag):
    """Return up to 10 lecture (user, module, start, end, tag) tuples."""
    candidates = _weekly_candidates(module.start_time)
    valid = [c for c in candidates if not _in_reading_week(c)][:10]
    return [(user, module, c, c + timedelta(hours=2), lecture_tag) for c in valid]

PRIORITY_DEADLINE_OFFSETS = [-5, 3, 7]

def _get_random_offset(used_offsets, index=None):
    if index is not None and index < len(PRIORITY_DEADLINE_OFFSETS):
        chosen = PRIORITY_DEADLINE_OFFSETS[index]
        used_offsets.add(chosen)
        return chosen
    available = [d for d in range(-3, 31) if d != 0 and d not in used_offsets]
    chosen = random.choice(available)
    used_offsets.add(chosen)
    return chosen

def _deadline_timing(deadline_type, now, day_offset):
    hour = 23 if deadline_type in ("coursework", "quiz") else random.choice([9, 11, 14, 16])
    start = now.replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=day_offset)
    end = start + timedelta(hours=2) if deadline_type in ("exam", "presentation") else None
    location = random.choice(lecture_theatre_fixtures) if deadline_type in ("exam", "presentation") else None
    return start, end, location

def _build_single_deadline(module, deadline_type, title, description, now, used_offsets, index=None):
    if Deadline.objects.filter(module=module, title=title).exists():
        return None
    day_offset = _get_random_offset(used_offsets, index=index)
    start, end, location = _deadline_timing(deadline_type, now, day_offset)
    return Deadline(
        module=module, title=title, deadline_type=deadline_type,
        description=description, start_due_date=start,
        end_due_date=end, location=location,
    )

def _get_deadline_templates(module):
    prefix = module.module_code[:2]
    default_list = list(deadline_fixtures[:3])
    return module_deadline_fixtures.get(
        module.module_code,
        module_deadline_fixtures.get(prefix, default_list),
    )

def build_deadlines_for_module(module):
    """Return unsaved Deadline instances for *module*."""
    templates = _get_deadline_templates(module)
    used_offsets = set()
    now = timezone.now()
    results = [_build_single_deadline(module, *t, now, used_offsets, index=i) for i, t in enumerate(templates)]
    return [d for d in results if d is not None]

def _weekend_days(seed_days):
    return [SEED_START + timedelta(days=d) for d in range(seed_days) if (SEED_START + timedelta(days=d)).weekday() in (5, 6)]

def _build_weekend_event_for_day(user, dt, personal_tags, user_rng):
    if user_rng.random() > 0.45:
        return None
    hour, minute, duration, title = user_rng.choice(WEEKEND_BLOCK_SPECS)
    start = dt.replace(hour=hour, minute=minute, second=0, microsecond=0)
    tag = user_rng.choice(personal_tags) if personal_tags else None
    return CalendarEvent(
        user=user, title=title, description="",
        start_time=start, end_time=start + timedelta(minutes=duration),
        location=None, tag=tag, priority='low', recurrence_rule=None,
    )

def build_weekend_events(user, tags, user_rng):
    """Random weekend blocking events to create realistic mixed availability."""
    personal_tags = [t for t in tags if (t.user_id == user.id or t.is_default) and t.name not in ACADEMIC_TAG_NAMES]
    events = [_build_weekend_event_for_day(user, dt, personal_tags, user_rng) for dt in _weekend_days(SEED_DAYS)]
    return [e for e in events if e]

def create_deadline_calendar_event(user, deadline):
    """Create or fetch the CalendarEvent that mirrors *deadline* in a user's calendar."""
    CalendarEvent.objects.get_or_create(
        user=user,
        title=f"{deadline.deadline_type.capitalize()}: {deadline.title}",
        start_time=deadline.start_due_date,
        defaults={
            'end_time': deadline.end_due_date or deadline.start_due_date,
            'location': deadline.location,
            'description': deadline.description,
            'priority': 'high',
            'module': deadline.module,
            'source': 'module_deadline',
            'external_id': str(deadline.id),
        },
    )

def build_deadline_event(user, deadline, tag=None):
    """Build an unsaved CalendarEvent for a deadline."""
    return CalendarEvent(
        user=user,
        title=f"{deadline.deadline_type.capitalize()}: {deadline.title}",
        start_time=deadline.start_due_date,
        end_time=deadline.end_due_date or deadline.start_due_date,
        location=deadline.location,
        description=deadline.description,
        priority='high',
        module=deadline.module,
        source='module_deadline',
        external_id=str(deadline.id),
        tag=tag,
    )
