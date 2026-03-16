"""
Factories for building User instances and Reading task history.
"""

import random
from datetime import time, timedelta

from django.utils import timezone
from django.contrib.auth import get_user_model
from faker import Faker

from studyFlax.models import UserSettings
from studyFlax.fixtures.data_fixtures import (
    course_fixtures, reading_fixtures,
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

def _teacher_bio(first, last):
    specialism = random.choice(TEACHING_SPECIALISMS)
    phd_uni = random.choice(PHD_UNIVERSITIES)
    others = [u for u in PRIOR_UNIVERSITIES if u != phd_uni] or PRIOR_UNIVERSITIES
    prior_uni = random.choice(others)
    return (
        f"Dr. {first} {last} specialises in {specialism}. "
        f"They completed their PhD at {phd_uni} after earlier study at {prior_uni}. "
        "Known for energetic, discussion-rich teaching, they combine academic rigour "
        "with practical, career-ready skills and clear feedback students can use immediately."
    )

def _student_bio(first):
    return (
        f"I am {first}, and {random.choice(STUDENT_INTRO_SNIPPETS)} "
        f"{random.choice(STUDENT_STUDY_SNIPPETS)} "
        f"{random.choice(STUDENT_PERSONALITY_SNIPPETS)}"
    )

def build_user(first, last, existing, role='student'):
    """Construct an unsaved User with a KCL email address and hashed password."""
    username = generate_unique_username(first, last, existing)
    bio = _teacher_bio(first, last) if role == 'teacher' else _student_bio(first)
    user = User(
        username=username,
        email=f"{first.lower()}.{last.lower()}@kcl.ac.uk",
        first_name=first, last_name=last,
        bio=bio, role=role,
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

def _build_single_settings(user):
    is_teacher = getattr(user, 'role', None) == 'teacher'
    return UserSettings(
        user=user,
        theme=random.choice(['light', 'dark']),
        timezone='Europe/London',
        year='' if is_teacher else random.choice(['Foundation', 'Year 1', 'Year 2', 'Year 3', 'Year 4']),
        major=random.choice(course_fixtures),
        sleep_time=time(23, 0),
        wake_time=time(7, 0),
        mode=random.choice(['light', 'dark']),
        homepage_widgets=[],
    )

def build_settings_for_new_users():
    """Return UserSettings instances for every user without a settings row."""
    return [_build_single_settings(u) for u in User.objects.filter(settings__isnull=True)]

def _build_readings(module, title, chapter, start, end, now):
    from studyFlax.models import Reading
    deadline = now + timedelta(days=random.randint(7, 28))
    if Reading.objects.filter(module=module, title=title).exists():
        return None
    return Reading(
        module=module, title=title, chapter=chapter,
        start_page=start, end_page=end, deadline=deadline,
    )

def build_readings_for_module(module):
    """Return unsaved Reading instances for *module*."""
    now = timezone.now()
    examples = random.sample(reading_fixtures, random.randint(1, 2))
    results = [_build_readings(module, f"{module.module_name}: {s}", c, st, en, now) for s, c, st, en in examples]
    return [r for r in results if r is not None]

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

def _reading_task_for_module(user, module, reading_list):
    from studyFlax.models import Reading
    readings = list(Reading.objects.filter(module=module))
    if not readings:
        return None
    return _build_reading_task(user, random.choice(readings), reading_list)

def build_reading_user_history_(user, modules, reading_list):
    """Return completed reading Task instances for a sample of the user's modules."""
    sampled = random.sample(modules, min(2, len(modules)))
    results = [_reading_task_for_module(user, m, reading_list) for m in sampled]
    return [t for t in results if t is not None]
