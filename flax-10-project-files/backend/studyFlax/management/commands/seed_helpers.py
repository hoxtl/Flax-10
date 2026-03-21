"""
Factories for building User instances and UserSettings rows.

Provides unique name generation, KCL email addresses, biographical
text for students and teachers, and bulk user construction used by
the seed management command.
"""

import random
from datetime import time

from django.contrib.auth import get_user_model
from faker import Faker

from studyFlax.models import UserSettings
from studyFlax.fixtures.data_fixtures import course_fixtures

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
    """Return a (first, last) pair not already present in *existing* or the database."""
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

def _random_year():
    return random.choice(['Foundation', 'Year 1', 'Year 2', 'Year 3', 'Year 4'])

def _random_theme():
    return random.choice(['light', 'dark'])

def _build_single_settings(user):
    is_teacher = getattr(user, 'role', None) == 'teacher'
    
    # Pinned widgets — always present, always at the top
    PINNED = ["deadlines", "todayTasks", "bigTimeline"]

    # Remaining optional widgets (exclude pinned ones)
    optional_widgets = [
        "rightNow", "tinyTimeline",
        "semesterOverview", "studyStreak", "weeklyGoal", "photo",
        "analyticsProductivity", "analyticsInsights", "analyticsDailyBreakdown",
        "analyticsStudyHours", "analyticsHeatmap", "analyticsPlannedActual",
        "analyticsVenio", "analyticsAttendance", "analyticsThemeUsage"
    ]

    # Pick 2-5 additional random widgets
    shuffled = optional_widgets[:]
    random.shuffle(shuffled)
    selected = ["hero"] + PINNED + shuffled[:random.randint(2, 5)]

    # Randomize sizes for chosen widgets
    sizes = {}
    for widget_id in selected:
        if widget_id == "hero":
            continue
        if widget_id == "bigTimeline":
            sizes[widget_id] = {"col": 2, "row": 2}
            continue
        sizes[widget_id] = {
            "col": 2 if random.random() > 0.6 else 1,
            "row": 2 if random.random() > 0.7 else 1
        }

    return UserSettings(
        user=user,
        theme=_random_theme(),
        timezone='Europe/London',
        year='' if is_teacher else _random_year(),
        major='' if is_teacher else random.choice(course_fixtures),
        sleep_time=time(23, 0),
        wake_time=time(7, 0),
        mode=_random_theme(),
        homepage_widgets=selected,
        homepage_widget_sizes=sizes,
    )

def build_settings_for_new_users():
    """Return UserSettings instances for every user that has no settings row yet."""
    return [_build_single_settings(u) for u in User.objects.filter(settings__isnull=True)]
