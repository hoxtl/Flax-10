"""
Orchestrates creation of admin, fixture and random users with settings.
"""

import random

from django.contrib.auth import get_user_model

from studyFlax.models import UserSettings
from .seed_helpers import build_users_list, build_settings_for_new_users

User = get_user_model()

USER_COUNT = 72
DEFAULT_PASSWORD = '1234'

FIXTURE_USERS = [
    {'username': 'johndoe', 'email': 'john.doe@kcl.ac.uk',  'first_name': 'John',    'last_name': 'Doe',    'is_superuser': True,  'is_staff': True},
    {'username': 'janedoe', 'email': 'jane.doe@kcl.ac.uk',  'first_name': 'Jane',    'last_name': 'Doe',    'is_superuser': False, 'is_staff': False},
    {'username': 'charlie', 'email': 'charlie@kcl.ac.uk',   'first_name': 'Charlie', 'last_name': 'Smith',  'is_superuser': False, 'is_staff': False},
    {'username': 'amiller', 'email': 'a.miller@kcl.ac.uk',  'first_name': 'Alice',   'last_name': 'Miller', 'is_superuser': False, 'is_staff': False},
]

ROLE_LABELS = {
    'johndoe': 'admin',
    'janedoe': 'student', 'charlie': 'student',
    'amiller': 'teacher',
}

TEACHER_USERNAMES = {
    'amiller',
}

TEACHER_BIOS = {
    'amiller': "Dr. Alice Miller specialises in political theory and comparative public policy. She completed her PhD at the London School of Economics after reading PPE at the University of Warwick. Her classes are energetic, debate-led, and focused on helping students turn complex ideas into sharp, persuasive arguments.",
}

STUDENT_BIOS = {
    'janedoe': "I am a momentum-first student who loves planning early and keeping deadline weeks calm. My routine is focused library blocks, active recall, and weekly resets that keep everything under control. Outside study, I am usually at society events or exploring new London cafes with friends.",
    'charlie': "I am project-driven and genuinely enjoy turning messy weeks into clean plans with clear next steps. Group revision is my favourite mode because teaching concepts out loud helps everything stick. I bring friendly energy, practical structure, and a strong finish to team work.",
}

STUDENT_BIO_TEMPLATES = [
    "I keep my week structured with focused study blocks, realistic goals, and early deadline planning so work stays calm and consistent. I like making progress visible and turning pressure weeks into manageable routines.",
    "I balance coursework, societies, and personal projects with short daily revision sessions and a clear plan for each week. I am big on momentum, accountability, and celebrating small wins early.",
    "I enjoy collaborative study, practical learning, and building steady progress across the term instead of last-minute rushes. My workflow is simple, energetic, and designed to keep me consistent.",
    "I am focused on strong habits this term: proactive planning, active recall, and regular check-ins on what is working. I care about doing excellent work without burning out in the process.",
]

JOHNDOE_BIO = (
    "Third-year medical student at King's with a focus on clinical anatomy "
    "and patient-centred care. I keep a tight weekly schedule with early morning "
    "revision blocks and evening review sessions. Outside lectures I volunteer at "
    "the campus health clinic and organise study groups for my cohort."
)

def create_admin_user(stdout):
    if User.objects.filter(username='johndoe').exists():
        return
    User.objects.create_superuser(
        username='johndoe', email='john.doe@kcl.ac.uk',
        password=DEFAULT_PASSWORD, first_name='John', last_name='Doe',
    )

def _apply_teacher_fields(user, username):
    user.role = 'teacher'
    user.bio = TEACHER_BIOS.get(
        username,
        "Lecturer at King's College London. Focused on practical teaching, clear feedback, and student success.",
    )

def _apply_student_fields(user, username):
    user.role = 'student'
    if username == 'johndoe':
        user.bio = JOHNDOE_BIO
        return
    user.bio = STUDENT_BIOS.get(username, random.choice(STUDENT_BIO_TEMPLATES))

def _update_fixture_user(user, data):
    user.email = data['email']
    user.first_name = data['first_name']
    user.last_name = data['last_name']
    user.is_superuser = data['is_superuser']
    user.is_staff = data['is_staff']
    username = data['username']
    if username in TEACHER_USERNAMES:
        _apply_teacher_fields(user, username)
    else:
        _apply_student_fields(user, username)
    user.set_password(DEFAULT_PASSWORD)
    user.save()

def _create_single_fixture_user(data, stdout):
    username = data['username']
    defaults = {k: v for k, v in data.items() if k not in ('is_superuser', 'is_staff')}
    user, _ = User.objects.get_or_create(username=username, defaults=defaults)
    _update_fixture_user(user, data)

def create_fixture_users(stdout):
    role_order = {'admin': 0, 'student': 1, 'teacher': 2}
    ordered_fixtures = sorted(
        FIXTURE_USERS,
        key=lambda data: (
            role_order.get(ROLE_LABELS.get(data['username'], 'student'), 1),
            data['username'],
        ),
    )
    for data in ordered_fixtures:
        _create_single_fixture_user(data, stdout)
    stdout.write("  Fixture users (password: 1234)")
    for data in ordered_fixtures:
        username = data['username']
        role = ROLE_LABELS.get(username, 'student')
        display_role = 'admin/student' if username == 'johndoe' else role
        stdout.write(f"    {username:<12} {display_role}")

def _compute_random_counts(needed, target_teacher_count=14):
    current_teacher_count = User.objects.filter(role='teacher').count()
    teacher_needed = max(0, target_teacher_count - current_teacher_count)
    random_teacher_count = min(teacher_needed, needed)
    random_student_count = needed - random_teacher_count
    return random_student_count, random_teacher_count

def _build_new_users(student_count, teacher_count):
    new_users = []
    if student_count > 0:
        new_users.extend(build_users_list(student_count, role='student'))
    if teacher_count > 0:
        new_users.extend(build_users_list(teacher_count, role='teacher'))
    return new_users

def _create_users_if_needed(stdout, target_teacher_count):
    """Create random users if below target count."""
    needed = USER_COUNT - User.objects.count()
    if needed <= 0:
        return
    student_count, teacher_count = _compute_random_counts(needed, target_teacher_count)
    new_users = _build_new_users(student_count, teacher_count)
    User.objects.bulk_create(new_users, ignore_conflicts=True)
    stdout.write(f"  + {needed} random users (Faker-generated)")


def _ensure_user_settings(stdout):
    """Ensure all users have settings rows."""
    new_settings = build_settings_for_new_users()
    if not new_settings:
        return
    UserSettings.objects.bulk_create(new_settings)


def create_random_users(stdout, target_teacher_count=14):
    """Create random users and ensure all have settings."""
    _create_users_if_needed(stdout, target_teacher_count)
    _ensure_user_settings(stdout)
