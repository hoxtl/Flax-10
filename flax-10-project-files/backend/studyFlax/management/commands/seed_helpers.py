import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from faker import Faker
from studyFlax.models import CalendarEvent, UserSettings, Deadline
from studyFlax.fixtures.data_fixtures import (
    course_fixtures, event_title_fixtures, description_fixtures,
    location_fixtures, lecture_theatre_fixtures, course_to_module_prefixes,
    deadline_fixtures, module_deadline_fixtures
)

User = get_user_model()
faker = Faker('en_GB')
DEFAULT_PASSWORD = '1234'


def is_name_taken(first, last, existing):
    return (User.objects.filter(first_name=first, last_name=last).exists()
            or any(u.first_name == first and u.last_name == last for u in existing))

def is_username_taken(username, existing):
    return (User.objects.filter(username=username).exists()
            or any(u.username == username for u in existing))

def has_unique_name(first, last, existing):
    return not is_name_taken(first, last, existing)

def generate_unique_name(existing):
    first, last = faker.first_name(), faker.last_name()
    while not has_unique_name(first, last, existing):
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
    user = User(username=username, email=f"{first.lower()}.{last.lower()}@kcl.ac.uk",
                first_name=first, last_name=last)
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
    return [UserSettings(user=u, theme=random.choice(['light', 'dark']),
                         timezone='Europe/London',
                         year=random.choice(['Foundation', 'Year 1', 'Year 2', 'Year 3', 'Year 4']),
                         major=random.choice(course_fixtures)) for u in new_users]

def pick_available_title(used_this_week):
    available = [t for t in event_title_fixtures if t not in used_this_week]
    return random.choice(available) if available else None

def build_event(user, title, tags, rules, day_offset):
    hour = random.choice([8, 10, 12, 14, 16, 18, 20])
    start = timezone.now().replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=day_offset)
    tag = random.choice(tags) if tags and random.random() > 0.2 else None
    rule = random.choice(rules) if rules and random.random() > 0.8 else None
    return CalendarEvent(
        user=user, title=title,
        description=random.choice(description_fixtures) if random.random() > 0.3 else "",
        start_time=start, end_time=start + timedelta(minutes=random.choice([60, 90, 120])),
        location=random.choice(location_fixtures) if random.random() > 0.7 else None,
        tag=tag, priority=random.choice(['low', 'medium', 'high', 'urgent']),
        recurrence_rule=rule
    )

def build_event_for_week(user, user_tags, rules, day_offset, used_per_week):
    week = day_offset // 7
    used = used_per_week.get(week, set())
    title = pick_available_title(used)
    if not title:
        return None
    used_per_week.setdefault(week, set()).add(title)
    return build_event(user, title, user_tags, rules, day_offset)

def build_events_for_user(user, tags, rules, count):
    user_tags = [t for t in tags if t.user == user or t.user is None]
    used_per_week = {}
    offsets = [faker.random_int(0, 60) for _ in range(count)]
    raw = [build_event_for_week(user, user_tags, rules, off, used_per_week) for off in offsets]
    return [e for e in raw if e]

def get_next_weekday_offset(weekday_offset):
    now, days_ahead = timezone.now(), 1
    candidate = now + timedelta(days=days_ahead)
    while candidate.weekday() != weekday_offset:
        days_ahead += 1
        candidate = now + timedelta(days=days_ahead)
    return days_ahead

def build_module_event(code, name, description, admin, weekly_rule):
    day_offset = get_next_weekday_offset(random.randint(0, 4))
    hour = random.choice([9, 10, 11, 14, 15, 16])
    start = timezone.now().replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=day_offset)
    return dict(module_code=code, module_name=name, description=description,
                created_by=admin, start_time=start, end_time=start + timedelta(hours=2),
                location=random.choice(lecture_theatre_fixtures), recurrence_rule=weekly_rule)

def get_user_modules(user, all_modules):
    major = getattr(getattr(user, 'settings', None), 'major', None)
    prefixes = course_to_module_prefixes.get(major, [])
    relevant = [m for m in all_modules if any(m.module_code.startswith(p) for p in prefixes)]
    return relevant if relevant else random.sample(all_modules, min(4, len(all_modules)))

def build_lecture_events(user, module, lecture_tag):
    events = []
    for week in range(10):
        start = module.start_time + timedelta(weeks=week)
        events.append((user, module, start, start + timedelta(hours=2), lecture_tag))
    return events

def create_lecture_event(user, module, start, end, lecture_tag):
    CalendarEvent.objects.get_or_create(
        user=user, title=f"Lecture: {module.module_name}", start_time=start,
        defaults={'end_time': end, 'location': module.location,
                  'description': module.module_name, 'tag': lecture_tag, 'priority': 'high'}
    )

def get_random_offset(used_offsets):
    while True:
        day_offset = random.randint(7, 30)
        if day_offset not in used_offsets:
            used_offsets.add(day_offset)
            return day_offset

def build_deadlines_for_module(module):
    prefix = module.module_code[:2]
    templates = module_deadline_fixtures.get(prefix, list(deadline_fixtures[:3]))
    used_offsets = set()
    deadlines = []
    now = timezone.now()
    for deadline_type, title, description in templates:
        day_offset = get_random_offset(used_offsets)
        hour = 23 if deadline_type in ("coursework", "quiz") else random.choice([9, 11, 14, 16])
        start_due = now.replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=day_offset)
        end_due = start_due + timedelta(hours=2) if deadline_type in ("exam", "presentation") else None
        location = random.choice(lecture_theatre_fixtures) if deadline_type in ("exam", "presentation") else None
        if not Deadline.objects.filter(module=module, title=title).exists():
            deadlines.append(Deadline(
                module=module, title=title, deadline_type=deadline_type, description=description,
                start_due_date=start_due, end_due_date=end_due, location=location,
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
        }
    )