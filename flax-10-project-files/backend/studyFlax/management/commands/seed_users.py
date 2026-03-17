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
    {'username': 'riley',   'email': 'riley.wood@kcl.ac.uk','first_name': 'Riley',   'last_name': 'Wood',   'is_superuser': False, 'is_staff': False},
    {'username': 'nina',    'email': 'nina.green@kcl.ac.uk','first_name': 'Nina',    'last_name': 'Green',  'is_superuser': False, 'is_staff': False},
    {'username': 'omar',    'email': 'omar.hassan@kcl.ac.uk','first_name': 'Omar',   'last_name': 'Hassan', 'is_superuser': False, 'is_staff': False},
    {'username': 'sofia',   'email': 'sofia.reid@kcl.ac.uk','first_name': 'Sofia',   'last_name': 'Reid',   'is_superuser': False, 'is_staff': False},
    {'username': 'liamk',   'email': 'liam.kelly@kcl.ac.uk','first_name': 'Liam',    'last_name': 'Kelly',  'is_superuser': False, 'is_staff': False},
    {'username': 'amiller', 'email': 'a.miller@kcl.ac.uk',  'first_name': 'Alice',   'last_name': 'Miller', 'is_superuser': False, 'is_staff': False},
    {'username': 'srahwan', 'email': 's.rahwan@kcl.ac.uk',  'first_name': 'Sam',     'last_name': 'Rahwan', 'is_superuser': False, 'is_staff': False},
    {'username': 'hpatel',  'email': 'h.patel@kcl.ac.uk',   'first_name': 'Hina',    'last_name': 'Patel',  'is_superuser': False, 'is_staff': False},
]

ROLE_LABELS = {
    'johndoe': 'admin',
    'janedoe': 'student', 'charlie': 'student',
    'riley': 'student', 'nina': 'student', 'omar': 'student', 'sofia': 'student', 'liamk': 'student',
    'amiller': 'teacher', 'srahwan': 'teacher', 'hpatel':  'teacher',
}

TEACHER_USERNAMES = {
    'amiller', 'srahwan', 'hpatel',
}

TEACHER_BIOS = {
    'amiller': "Dr. Alice Miller specialises in political theory and comparative public policy. She completed her PhD at the London School of Economics after reading PPE at the University of Warwick. Her classes are energetic, debate-led, and focused on helping students turn complex ideas into sharp, persuasive arguments.",
    'srahwan': "Dr. Sam Rahwan specialises in acute and community nursing education. He completed his PhD at the University of Edinburgh following postgraduate clinical study at King's College London. His teaching style is scenario-driven, practical, and confidence-building, especially for placements and OSCE preparation.",
    'hpatel': "Dr. Hina Patel specialises in biostatistics and population health analytics. She completed her PhD at Imperial College London after earlier study at University College London. She is known for making difficult statistical ideas click quickly through clear frameworks, relatable case studies, and highly actionable feedback.",
}

STUDENT_BIOS = {
    'janedoe': "I am a momentum-first student who loves planning early and keeping deadline weeks calm. My routine is focused library blocks, active recall, and weekly resets that keep everything under control. Outside study, I am usually at society events or exploring new London cafes with friends.",
    'charlie': "I am project-driven and genuinely enjoy turning messy weeks into clean plans with clear next steps. Group revision is my favourite mode because teaching concepts out loud helps everything stick. I bring friendly energy, practical structure, and a strong finish to team work.",
    'riley': "I like connecting big policy ideas to real-world decisions and current affairs. My workflow is short deep-focus sprints, sharp notes, and quick evening review sessions that stop work from piling up. I keep things balanced with reading, long walks, and low-key social plans.",
    'nina': "I work best with a steady rhythm and realistic goals that protect quality without burnout. I start assignments early, build revision in layers, and keep my week flexible for unexpected tasks. I love collaborative study spaces and helping friends break down difficult topics.",
    'omar': "I am into building practical things, from coursework tools to side projects that solve everyday problems. My system is simple: plan once, execute daily, and track progress visually so motivation stays high. I also make time for football, community events, and mentoring peers.",
    'sofia': "I enjoy combining creative thinking with structured planning, especially in reading-heavy modules. My term strategy is clear milestones, consistent review, and strong communication with teammates. I am usually the one organising study groups and turning revision into something social and fun.",
    'liamk': "I am focused on long-term growth, balancing academics, internships, and skill-building each week. I keep a practical schedule with focused work windows and protected recovery time so performance stays steady. I like reflecting often, improving fast, and helping others do the same.",
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
    stdout.write(f"  {'johndoe':<12} admin")

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
    role = ROLE_LABELS.get(username, '')
    stdout.write(f"  {username:<12} {role}")

def create_fixture_users(stdout):
    stdout.write("Creating fixture users...")
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

def create_random_users(stdout, target_teacher_count=14):
    needed = USER_COUNT - User.objects.count()
    if needed <= 0:
        stdout.write("Enough users already exist.")
        return
    student_count, teacher_count = _compute_random_counts(needed, target_teacher_count)
    stdout.write(
        f"Seeding {needed} random users "
        f"({student_count} students, {teacher_count} teachers)..."
    )
    new_users = _build_new_users(student_count, teacher_count)
    User.objects.bulk_create(new_users, ignore_conflicts=True)
    UserSettings.objects.bulk_create(build_settings_for_new_users())
