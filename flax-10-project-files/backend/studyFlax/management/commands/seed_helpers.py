import random
from datetime import date, datetime, timedelta, timezone as dt_timezone
from django.utils import timezone
from django.contrib.auth import get_user_model
from faker import Faker
from studyFlax.models import CalendarEvent, UserSettings, Deadline
from studyFlax.fixtures.data_fixtures import (
    course_fixtures, event_title_fixtures, description_fixtures,
    location_fixtures, lecture_theatre_fixtures, course_to_module_prefixes,
    breakfast_fixtures, lunch_fixtures, dinner_fixtures,
    module_deadline_fixtures, deadline_fixtures,
)

User = get_user_model()
faker = Faker('en_GB')
DEFAULT_PASSWORD = '1234'

SEED_START = datetime(2026, 1, 15, 0, 0, 0, tzinfo=dt_timezone.utc)
SEED_DAYS  = 365

READING_WEEK_START = date(2026, 2, 23)
READING_WEEK_END   = date(2026, 2, 27)


def _in_reading_week(dt):
    d = dt.date() if hasattr(dt, 'date') else dt
    return READING_WEEK_START <= d <= READING_WEEK_END


def is_name_taken(first, last, existing):
    return (
        User.objects.filter(first_name=first, last_name=last).exists()
        or any(u.first_name == first and u.last_name == last for u in existing)
    )


def is_username_taken(username, existing):
    return (
        User.objects.filter(username=username).exists()
        or any(u.username == username for u in existing)
    )


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


def build_event(user, title, tags, day_offset, hour):
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
    non_lecture_hours = [8, 13, 17, 19, 20]
    events = []
    week_titles  = []
    current_week = -1

    for day_offset in range(SEED_DAYS):
        week = day_offset // 7
        if week != current_week:
            week_titles  = _fresh_week_titles()
            current_week = week

        daily_count = random.randint(1, 2)
        day_hours = random.sample(non_lecture_hours, min(daily_count, len(non_lecture_hours)))

        for hour in day_hours:
            if not week_titles:
                week_titles = _fresh_week_titles()
            title = week_titles.pop()
            events.append(build_event(user, title, tags, day_offset, hour))

    return events


def build_today_afternoon_events(user, tags):
    """Five mock events for today between 14:30 and 20:00: Academic, Social, Admin + 2 more."""
    now = timezone.now()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    user_tags = [t for t in tags if t.user == user or t.user is None]
    tag = random.choice(user_tags) if user_tags else None

    slots = [
        (14, 30, 60, "Review notes", "Academic"),
        (15, 30, 30, "Coffee with flatmates", "Social"),
        (16, 30, 45, "Reply to emails", "Admin"),
        (17, 45, 60, "Study at library", "Academic"),
        (19, 0, 30, "Plan tomorrow", "Admin"),
    ]
    events = []
    for hour, minute, duration_min, title, _ in slots:
        start = today.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if start.tzinfo is None:
            start = timezone.make_aware(start)
        end = start + timedelta(minutes=duration_min)
        events.append(CalendarEvent(
            user=user,
            title=title,
            description="",
            start_time=start,
            end_time=end,
            tag=tag,
            priority=random.choice(['low', 'medium', 'high']),
            recurrence_rule=None,
        ))
    return events


def build_meal_events(user, tags):
    """Meals (Breakfast, Lunch, Dinner) use Routine or Wellness tag — NOT Academic/Work."""
    routine_tag = next((t for t in tags if t.name == 'Routine'), None)
    wellness_tag = next((t for t in tags if t.name == 'Wellness'), None)
    meal_tag = routine_tag or wellness_tag or (tags[0] if tags else None)
    events   = []

    for day_offset in range(SEED_DAYS):
        base = SEED_START + timedelta(days=day_offset)
        meals = [
            ("Breakfast", breakfast_fixtures, 8,  0,  8,  30),
            ("Lunch",     lunch_fixtures,     12, 30, 13, 15),
            ("Dinner",    dinner_fixtures,    19,  0, 19, 45),
        ]
        for label, fixture_list, sh, sm, eh, em in meals:
            description = fixture_list[day_offset % len(fixture_list)]
            events.append(CalendarEvent(
                user=user,
                title=label,
                description=description,
                start_time=base.replace(hour=sh, minute=sm, second=0, microsecond=0),
                end_time=base.replace(hour=eh, minute=em, second=0, microsecond=0),
                source="personal",
                tag=meal_tag,
                recurrence_rule=None,
            ))

    return events


def _first_weekday_from(start_dt, weekday):
    days_ahead = (weekday - start_dt.weekday()) % 7
    return start_dt + timedelta(days=days_ahead)


def build_module_event(code, name, description, admin, weekly_rule):
    weekday = random.randint(0, 4)
    hour    = random.choice([9, 10, 11, 14, 15, 16])
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
    major    = getattr(getattr(user, 'settings', None), 'major', None)
    prefixes = course_to_module_prefixes.get(major, [])
    core     = [m for m in all_modules if any(m.module_code.startswith(p) for p in prefixes)][:3]
    non_core = [m for m in all_modules if m not in core]
    extras   = random.sample(non_core, min(1, len(non_core)))
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
    sessions  = []
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


def _get_random_offset(used_offsets):
    while True:
        day_offset = random.randint(7, 30)
        if day_offset not in used_offsets:
            used_offsets.add(day_offset)
            return day_offset


def build_deadlines_for_module(module):
    prefix = module.module_code[:2]
    default_list = list(deadline_fixtures[:3])
    templates = module_deadline_fixtures.get(
        module.module_code,
        module_deadline_fixtures.get(prefix, default_list),
    )
    used_offsets = set()
    deadlines    = []
    now = timezone.now()

    for deadline_type, title, description in templates:
        day_offset = _get_random_offset(used_offsets)
        hour = 23 if deadline_type in ("coursework", "quiz") else random.choice([9, 11, 14, 16])
        start_due  = now.replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=day_offset)
        end_due    = start_due + timedelta(hours=2) if deadline_type in ("exam", "presentation") else None
        location   = random.choice(lecture_theatre_fixtures) if deadline_type in ("exam", "presentation") else None

        if not Deadline.objects.filter(module=module, title=title).exists():
            deadlines.append(Deadline(
                module=module,
                title=title,
                deadline_type=deadline_type,
                description=description,
                start_due_date=start_due,
                end_due_date=end_due,
                location=location,
            ))

    return deadlines


def create_deadline_calendar_event(user, deadline):
    CalendarEvent.objects.get_or_create(
        user=user,
        title=f"{deadline.deadline_type.capitalize()}: {deadline.title}",
        start_time=deadline.start_due_date,
        defaults={
            'end_time': deadline.end_due_date or deadline.start_due_date,
            'location': deadline.location,
            'description': deadline.description,
            'priority': 'high',
        },
    )