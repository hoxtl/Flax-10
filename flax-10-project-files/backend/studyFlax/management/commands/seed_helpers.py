import random
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from django.utils import timezone
from django.contrib.auth import get_user_model
from faker import Faker
from studyFlax.models import CalendarEvent, UserSettings
from studyFlax.fixtures.data_fixtures import (
    course_fixtures, event_title_fixtures, description_fixtures,
    location_fixtures, lecture_theatre_fixtures, course_to_module_prefixes
)

User = get_user_model()
faker = Faker('en_GB')
DEFAULT_PASSWORD = '1234'

# Seeding anchored to the start of term, not today
SEED_START = datetime(2026, 1, 15, 0, 0, 0, tzinfo=ZoneInfo("Europe/London"))
SEED_DAYS = 365  # personal events cover a full year

# Reading week: no lectures between these dates (inclusive)
READING_WEEK_START = date(2026, 2, 23)
READING_WEEK_END   = date(2026, 2, 27)


def _in_reading_week(dt):
    d = dt.date() if hasattr(dt, 'date') else dt
    return READING_WEEK_START <= d <= READING_WEEK_END


# ---------------------------------------------------------------------------
# User helpers
# ---------------------------------------------------------------------------

def is_name_taken(first, last, existing):
    return (User.objects.filter(first_name=first, last_name=last).exists()
            or any(u.first_name == first and u.last_name == last for u in existing))


def is_username_taken(username, existing):
    return (User.objects.filter(username=username).exists()
            or any(u.username == username for u in existing))


def generate_unique_name(existing):
    first, last = faker.first_name(), faker.last_name()
    while is_name_taken(first, last, existing):
        first, last = faker.first_name(), faker.last_name()
    return first, last


def generate_unique_username(first, last, existing):
    base = f"{first.lower()}.{last.lower()}"
    username, counter = base, 2
    while is_username_taken(username, existing):
        username = f"{base}{counter}"
        counter += 1
    return username


def build_user(first, last, existing):
    username = generate_unique_username(first, last, existing)
    user = User(
        username=username,
        email=f"{first.lower()}.{last.lower()}@kcl.ac.uk",
        first_name=first,
        last_name=last,
    )
    user.set_password(DEFAULT_PASSWORD)
    return user


def build_users_list(needed):
    users_to_create = []
    for _ in range(needed):
        first, last = generate_unique_name(users_to_create)
        users_to_create.append(build_user(first, last, users_to_create))
    return users_to_create


def build_settings_for_new_users():
    new_users = User.objects.filter(settings__isnull=True)
    return [
        UserSettings(
            user=u,
            theme=random.choice(['light', 'dark']),
            timezone='Europe/London',
            year=random.choice(['Foundation', 'Year 1', 'Year 2', 'Year 3', 'Year 4']),
            major=random.choice(course_fixtures),
        )
        for u in new_users
    ]


# ---------------------------------------------------------------------------
# Personal event helpers
# ---------------------------------------------------------------------------

def build_event(user, title, tags, day_offset, hour):
    """Single personal event anchored to SEED_START. Never recurs."""
    start = SEED_START.replace(hour=hour, minute=0, second=0) + timedelta(days=day_offset)
    duration = random.choice([60, 90, 120])
    user_tags = [t for t in tags if t.user == user or t.user is None]
    tag = random.choice(user_tags) if user_tags and random.random() > 0.2 else None

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


def build_events_for_user(user, tags, rules, count):
    """
    Seed personal events for SEED_DAYS days from SEED_START.
    Titles reshuffle every week so each week looks different.
    Personal events happen during reading week too — only lectures skip it.
    """
    non_lecture_hours = [8, 13, 17, 19, 20]
    events = []
    week_titles = []
    current_week = -1

    for day_offset in range(SEED_DAYS):
        week = day_offset // 7
        if week != current_week:
            week_titles = _fresh_week_titles()
            current_week = week

        daily_count = random.randint(1, 2)
        day_hours = random.sample(non_lecture_hours, min(daily_count, len(non_lecture_hours)))

        for hour in day_hours:
            if not week_titles:
                week_titles = _fresh_week_titles()
            title = week_titles.pop()
            events.append(build_event(user, title, tags, day_offset, hour))

    return events


# ---------------------------------------------------------------------------
# Module / lecture helpers
# ---------------------------------------------------------------------------

def _first_weekday_from(start_dt, weekday):
    """Return the first datetime >= start_dt that falls on the given weekday (0=Mon)."""
    days_ahead = (weekday - start_dt.weekday()) % 7
    return start_dt + timedelta(days=days_ahead)


def build_module_event(code, name, description, admin, weekly_rule):
    """
    Schedule the module's first lecture on a random weekday on or after SEED_START.
    """
    weekday = random.randint(0, 4)  # Mon–Fri
    hour = random.choice([9, 10, 11, 14, 15, 16])
    first_lecture = _first_weekday_from(SEED_START, weekday).replace(
        hour=hour, minute=0, second=0
    )
    return dict(
        module_code=code,
        module_name=name,
        description=description,
        created_by=admin,
        start_time=first_lecture,
        end_time=first_lecture + timedelta(hours=2),
        location=random.choice(lecture_theatre_fixtures),
        recurrence_rule=weekly_rule,
    )


def get_user_modules(user, all_modules):
    major = getattr(getattr(user, 'settings', None), 'major', None)
    prefixes = course_to_module_prefixes.get(major, [])
    core = [m for m in all_modules if any(m.module_code.startswith(p) for p in prefixes)][:3]
    non_core = [m for m in all_modules if m not in core]
    extras = random.sample(non_core, min(1, len(non_core)))
    return core, extras


def create_lecture_event(user, module, start, end, lecture_tag):
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
        },
    )


def build_lecture_events(user, module, lecture_tag):
    """
    Generate exactly 10 lecture instances, one per week, skipping reading week.
    If a slot falls in reading week it is pushed to the following week so the
    total always reaches 10 sessions.
    """
    sessions = []
    candidate = module.start_time
    while len(sessions) < 10:
        if not _in_reading_week(candidate):
            sessions.append((
                user,
                module,
                candidate,
                candidate + timedelta(hours=2),
                lecture_tag,
            ))
        candidate += timedelta(weeks=1)
    return sessions