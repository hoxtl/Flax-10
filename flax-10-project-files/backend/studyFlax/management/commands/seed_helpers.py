"""
Helper factories for the seed management command.

Each public function is a pure factory — it constructs model instances or
performs targeted get_or_create calls without orchestrating the overall
seeding flow. Orchestration lives in seed.Command.
"""

import random
from datetime import date, datetime, time, timedelta, timezone as dt_timezone
from django.utils import timezone
from django.contrib.auth import get_user_model
from faker import Faker
from studyFlax.models import CalendarEvent, UserSettings, Deadline
from studyFlax.fixtures.data_fixtures import (
    course_fixtures, event_title_fixtures, description_fixtures,
    location_fixtures, lecture_theatre_fixtures, course_to_module_prefixes,
    breakfast_fixtures, lunch_fixtures, dinner_fixtures,
    module_deadline_fixtures, deadline_fixtures, reading_fixtures
)

User = get_user_model()
faker = Faker('en_GB')
DEFAULT_PASSWORD = '1234'
STUDENT_INTRO_SNIPPETS = [
    "I thrive on turning busy uni weeks into a game plan that is actually realistic.",
    "I am most in my zone when my calendar is tidy, my goals are clear, and my notes are colour-coded.",
    "I love practical learning and finding smart ways to make heavy weeks feel lighter.",
    "I am a momentum person - small daily wins keep me consistent and confident.",
    "I am curious, collaborative, and always up for a focused study sprint with friends.",
]

STUDENT_STUDY_SNIPPETS = [
    "My weekly rhythm is active recall, short deep-work blocks, and a Sunday reset so deadlines never sneak up.",
    "I split assignments into mini-milestones, track progress visually, and leave buffer time for edits.",
    "I prefer focused sessions over marathon cramming, and I build in breaks so quality stays high.",
    "I learn best by explaining concepts out loud, building summary sheets, and revisiting them through the week.",
    "I keep a practical system: plan early, execute steadily, review often, and avoid panic mode.",
]

STUDENT_PERSONALITY_SNIPPETS = [
    "Outside class, I recharge with long walks, good playlists, and trying new cafes around London.",
    "When I am not studying, I am usually at a society event, working on side projects, or exploring new places in the city.",
    "I enjoy meeting new people, sharing revision tricks, and making difficult topics feel approachable.",
    "I care about great grades, but I care just as much about building healthy habits that last beyond uni.",
    "I bring friendly energy to group work and I am usually the one turning chaos into a clear next step.",
]

TEACHING_SPECIALISMS = [
    "applied machine learning and responsible AI systems",
    "clinical decision-making in acute and community care",
    "behavioural economics and policy evaluation",
    "distributed systems, cloud platforms, and software architecture",
    "public health strategy, prevention science, and epidemiology",
    "digital media, cultural analysis, and communication theory",
    "biostatistics, research design, and health data interpretation",
    "financial strategy, risk analysis, and corporate governance",
    "educational psychology, learning science, and assessment design",
    "human-centred product design and service innovation",
    "international business strategy and cross-cultural leadership",
]

PHD_UNIVERSITIES = [
    "University of Cambridge",
    "University of Oxford",
    "Imperial College London",
    "University College London",
    "The London School of Economics and Political Science",
    "ETH Zurich",
    "Stanford University",
    "Massachusetts Institute of Technology",
    "University of Toronto",
    "National University of Singapore",
    "University of Melbourne",
    "University of Edinburgh",
]

PRIOR_UNIVERSITIES = [
    "University of Manchester",
    "University of Bristol",
    "University of Warwick",
    "University of Leeds",
    "University of Glasgow",
    "Durham University",
    "King's College London",
    "University of Birmingham",
    "University of Nottingham",
    "University of Sheffield",
]

SEED_START = datetime(2026, 1, 15, 0, 0, 0, tzinfo=dt_timezone.utc)
SEED_DAYS  = 365

READING_WEEK_START = date(2026, 2, 23)
READING_WEEK_END   = date(2026, 2, 27)


def _in_reading_week(dt):
    d = dt.date() if hasattr(dt, 'date') else dt
    return READING_WEEK_START <= d <= READING_WEEK_END


def is_name_taken(first, last, existing):
    """Return True if a user with this first and last name already exists."""
    return (
        User.objects.filter(first_name=first, last_name=last).exists()
        or any(u.first_name == first and u.last_name == last for u in existing)
    )


def is_username_taken(username, existing):
    """Return True if the username exists in the database or the given list."""
    return (
        User.objects.filter(username=username).exists()
        or any(u.username == username for u in existing)
    )


def generate_unique_name(existing):
    """Generate a first/last name pair not already used by any user."""
    first, last = faker.first_name(), faker.last_name()
    while is_name_taken(first, last, existing):
        first, last = faker.first_name(), faker.last_name()
    return first, last


def generate_unique_username(first, last, existing):
    """Derive a first.last username that is unique, appending a counter if needed."""
    base = f"{first.lower()}.{last.lower()}"
    username, counter = base, 2
    while is_username_taken(username, existing):
        username = f"{base}{counter}"
        counter += 1
    return username


def build_user(first, last, existing, role='student'):
    """Construct an unsaved User with a KCL email address and hashed password."""
    username = generate_unique_username(first, last, existing)
    if role == 'teacher':
        specialism = random.choice(TEACHING_SPECIALISMS)
        phd_uni = random.choice(PHD_UNIVERSITIES)
        prior_uni = random.choice([u for u in PRIOR_UNIVERSITIES if u != phd_uni] or PRIOR_UNIVERSITIES)
        bio = (
            f"Dr. {first} {last} specialises in {specialism}. "
            f"They completed their PhD at {phd_uni} after earlier study at {prior_uni}. "
            "Known for energetic, discussion-rich teaching, they combine academic rigour with practical, career-ready skills and clear feedback students can use immediately."
        )
    else:
        bio = (
            f"I am {first}, and {random.choice(STUDENT_INTRO_SNIPPETS)} "
            f"{random.choice(STUDENT_STUDY_SNIPPETS)} "
            f"{random.choice(STUDENT_PERSONALITY_SNIPPETS)}"
        )
    user = User(
        username=username,
        email=f"{first.lower()}.{last.lower()}@kcl.ac.uk",
        first_name=first,
        last_name=last,
        bio=bio,
        role=role,
    )
    user.set_password(DEFAULT_PASSWORD)
    return user


def build_users_list(needed, role='student'):
    """Return a list of *needed* unsaved User instances with unique names and usernames."""
    users_to_create = []
    for _ in range(needed):
        first, last = generate_unique_name(users_to_create)
        users_to_create.append(build_user(first, last, users_to_create, role=role))
    return users_to_create


def build_settings_for_new_users():
    """Return a list of UserSettings instances for every user that has no settings row yet."""
    new_users = User.objects.filter(settings__isnull=True)
    settings = []
    for u in new_users:
        settings.append(
            UserSettings(
                user=u,
                theme=random.choice(['light', 'dark']),
                timezone='Europe/London',
                year='' if getattr(u, 'role', None) == 'teacher' else random.choice(['Foundation', 'Year 1', 'Year 2', 'Year 3', 'Year 4']),
                major=random.choice(course_fixtures),
                sleep_time=time(23, 0),
                wake_time=time(7, 0),
                mode=random.choice(['light', 'dark']),
                homepage_widgets=[],
            )
        )
    return settings


def build_event(user, title, tags, day_offset, hour):
    """Construct a single unsaved CalendarEvent for *user* at the given day offset and hour."""
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
    """Return a dict of Module field values for a weekly recurring lecture.

    The first occurrence is scheduled on a random weekday at a random lecture
    hour starting from SEED_START, placed in a random KCL lecture theatre.
    """
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
    """Return (core_modules, extra_modules) matched to the user's declared major.

    core_modules — up to three modules whose prefix matches the user's course.
    extra_modules — one randomly chosen module outside the core set, simulating
    an elective.
    """
    major    = getattr(getattr(user, 'settings', None), 'major', None)
    prefixes = course_to_module_prefixes.get(major, [])
    core     = [m for m in all_modules if any(m.module_code.startswith(p) for p in prefixes)][:3]
    non_core = [m for m in all_modules if m not in core]
    extras   = random.sample(non_core, min(1, len(non_core)))
    return core, extras


def create_lecture_event(user, module, start, end, lecture_tag):
    """Create or fetch the CalendarEvent representing one lecture occurrence.

    Uses get_or_create keyed on (user, title, start_time) so that
    re-running the seed command never duplicates events.
    """
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
    """Return a list of unsaved Deadline instances for *module*.

    Templates are taken from module_deadline_fixtures using the full module
    code first, then the two-letter module code prefix; deadline_fixtures is
    used as a fallback. Each deadline is given a unique due-date offset so
    no two share the same day.
    """
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
    """Create or fetch the CalendarEvent that mirrors *deadline* in a user's calendar.

    Uses get_or_create keyed on (user, title, start_time) so that
    re-running the seed never duplicates deadline events.
    """
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


# ---------------------------------------------------------------------------
# Study session & theme session seeding
# ---------------------------------------------------------------------------

TASK_LABELS = [
    'CS4303 programming assignment',
    'HI4101 essay',
    'MA4201 problem set',
    'PH4102 lab report',
    'Literature review',
    'Revision: data structures',
    'Revision: algorithms',
    'Group project planning',
    'Reply to supervisor email',
    'Plan the week ahead',
    'Past paper practice',
    'Reading week catch-up',
]


def build_study_sessions_for_user(user, profile='balanced'):
    """
    Returns a list of StudySession instances across the past 90 days.
    Profiles:
      'balanced'   – steady weekday studier, short weekend dips   (janedoe)
      'night_owl'  – late evening sessions, irregular weekends     (charlie)
      'consistent' – high volume, long streaks                     (random fixture users)
      'power_user' – studies every day, long sessions, heavy volume
    """
    from studyFlax.models.timer.sessionModel import StudySession
    now      = timezone.now()
    sessions = []
    # profile-specific knobs
    if profile == 'night_owl':
        preferred_hours     = [20, 21, 22, 23]
        weekend_probability = 0.55
        skip_day_prob       = 0.25
        sessions_per_day    = (1, 3)
        work_choices        = [25, 50, 75, 100]
    elif profile == 'consistent':
        preferred_hours     = [9, 10, 14, 15, 16]
        weekend_probability = 0.70
        skip_day_prob       = 0.10
        sessions_per_day    = (2, 4)
        work_choices        = [50, 75, 100, 125]
    elif profile == 'power_user':
        preferred_hours     = [8, 9, 10, 11, 13, 14, 15, 16, 19, 20]
        weekend_probability = 0.95
        skip_day_prob       = 0.04
        sessions_per_day    = (3, 6)
        work_choices        = [75, 100, 125, 150, 175, 200]
    else:  # balanced
        preferred_hours     = [9, 10, 11, 14, 15, 16]
        weekend_probability = 0.40
        skip_day_prob       = 0.20
        sessions_per_day    = (1, 3)
        work_choices        = [25, 50, 75]
    for day_offset in range(90):
        session_date = now - timedelta(days=day_offset)
        is_weekend   = session_date.weekday() >= 5
        if is_weekend and random.random() > weekend_probability:
            continue
        if not is_weekend and random.random() < skip_day_prob:
            continue
        sessions_today = random.randint(*sessions_per_day)
        hours_used     = random.sample(preferred_hours, min(sessions_today, len(preferred_hours)))
        for hour in hours_used:
            work_mins  = random.choice(work_choices)
            if profile == 'power_user' and random.random() < 0.15:
                work_mins += random.choice([25, 50])
            break_mins = (work_mins // 25) * 5
            n_sessions = work_mins // 25
            overtime_prob = 0.20 if profile == 'power_user' else 0.08
            status     = 'Overtime' if random.random() < overtime_prob else 'Completed'
            start = session_date.replace(hour=hour, minute=random.randint(0, 15), second=0, microsecond=0)
            end   = start + timedelta(minutes=work_mins + break_mins)
            block_id = int(start.timestamp() * 1000)
            sessions.append(StudySession(
                user=user,
                study_block_id=block_id,
                start_time=start,
                end_time=end,
                duration=work_mins * 60,
                break_duration=break_mins * 60,
                session_count=n_sessions,
                task=random.choice(TASK_LABELS),
                status=status,
            ))
    return sessions

    return sessions


def build_theme_sessions_for_user(user, profile='balanced'):
    """
    Returns a list of ThemeSession instances across the past 90 days.

    Profiles:
      'balanced'   – mostly light, some dark afternoons
      'night_owl'  – mostly dark, especially evenings (20-23h)
      'consistent' – mixed, slight light preference
    """
    from studyFlax.models.timer.themeSessionModel import ThemeSession

    now      = timezone.now()
    sessions = []

    for day_offset in range(90):
        base = now - timedelta(days=day_offset)

        if profile == 'night_owl':
            # daytime: short light session, evening: long dark session
            slots = [
                (8,  'light', random.randint(30, 90)),
                (20, 'dark',  random.randint(90, 240)),
                (22, 'dark',  random.randint(30, 90)),
            ]
        elif profile == 'consistent':
            slots = [
                (9,  'light', random.randint(60, 180)),
                (14, 'light', random.randint(60, 120)),
                (19, 'dark',  random.randint(30, 90)),
            ]
        else:  # balanced
            slots = [
                (9,  'light', random.randint(60, 180)),
                (13, 'light', random.randint(30, 90)),
                (20, 'dark',  random.randint(30, 120)),
            ]

        for hour, theme, duration in slots:
            if random.random() < 0.15:   # occasional skip for realism
                continue
            started = base.replace(hour=hour, minute=0, second=0, microsecond=0)
            ended   = started + timedelta(minutes=duration)
            sessions.append(ThemeSession(
                user=user,
                theme=theme,
                started_at=started,
                ended_at=ended,
                duration_minutes=duration,
            ))

    return sessions

# Reading seeding helpers

def _build_readings(module, title, chapter, start, end, now):
    from studyFlax.models import Reading
    deadline = now + timedelta(days=random.randint(7,28))
    if Reading.objects.filter(module=module, title=title).exists():
        return None
    return Reading(
        module=module, title=title, chapter=chapter, start_page=start, end_page=end, deadline=deadline,
    )

def build_readings_for_module(module):
    from studyFlax.models import Reading
    now = timezone.now()
    reading_examples = random.sample(reading_fixtures, random.randint(1,2))
    readings = []
    for suffix, chapter, start, end in reading_examples:
        read = _build_readings(module, f"{module.module_name}: {suffix}", chapter, start, end, now)
        if read:
            readings.append(read)
    return readings

def _build_reading_task(user, reading, reading_list):
    from studyFlax.models import Task
    pages = reading.page_count()
    if pages <= 0:
        return None
    if Task.objects.filter(user=user, reading=reading).exists():
        return None
    speed = round(random.uniform(1.2, 2.5), 1)
    return Task(
        user=user, task_list=reading_list, module=reading.module,
        reading=reading, title=f"Read: {reading.title}",
        page_count=pages, time_spent_minutes=round(pages * speed),
        completed=True, completed_at=timezone.now() - timedelta(days=random.randint(1, 14)),
        priority='medium', energy_level='medium', due_date=reading.deadline,
    )

def build_reading_user_history_(user, modules, reading_list):
    from studyFlax.models import Reading
    tasks = []
    for module in random.sample(modules, min(2, len(modules))):
        readings = list(Reading.objects.filter(module=module))
        if not readings:
            continue
        task = _build_reading_task(user, random.choice(readings), reading_list)
        if task: 
            tasks.append(task)
    return tasks