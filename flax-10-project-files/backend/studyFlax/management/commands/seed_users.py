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
    {'username': 'echen',   'email': 'e.chen@kcl.ac.uk',    'first_name': 'Eric',    'last_name': 'Chen',   'is_superuser': False, 'is_staff': False},
    {'username': 'jmurphy', 'email': 'j.murphy@kcl.ac.uk',  'first_name': 'James',   'last_name': 'Murphy', 'is_superuser': False, 'is_staff': False},
]

ROLE_LABELS = {
    'johndoe': 'admin',
    'janedoe': 'student', 'charlie': 'student',
    'riley': 'student', 'nina': 'student', 'omar': 'student', 'sofia': 'student', 'liamk': 'student',
    'amiller': 'teacher', 'srahwan': 'teacher',
    'hpatel':  'teacher', 'echen':   'teacher', 'jmurphy': 'teacher',
}

TEACHER_USERNAMES = {
    'amiller', 'srahwan', 'hpatel', 'echen', 'jmurphy',
}

TEACHER_BIOS = {
    'amiller': "Dr. Alice Miller specialises in political theory and comparative public policy. She completed her PhD at the London School of Economics after reading PPE at the University of Warwick. Her classes are energetic, debate-led, and focused on helping students turn complex ideas into sharp, persuasive arguments.",
    'srahwan': "Dr. Sam Rahwan specialises in acute and community nursing education. He completed his PhD at the University of Edinburgh following postgraduate clinical study at King's College London. His teaching style is scenario-driven, practical, and confidence-building, especially for placements and OSCE preparation.",
    'hpatel': "Dr. Hina Patel specialises in biostatistics and population health analytics. She completed her PhD at Imperial College London after earlier study at University College London. She is known for making difficult statistical ideas click quickly through clear frameworks, relatable case studies, and highly actionable feedback.",
    'echen': "Dr. Eric Chen specialises in distributed systems, software architecture, and cloud engineering. He completed his PhD at the University of Cambridge after studying computer science at the University of Manchester. His sessions blend strong theory with real engineering trade-offs so students build production-ready thinking.",
    'jmurphy': "Dr. James Murphy specialises in applied mathematics, optimisation, and quantitative modelling. He completed his PhD at the University of Oxford after studying mathematics at Durham University. His lectures are high-energy, intuitive, and packed with worked examples that make exam preparation feel structured and achievable.",
    'swan': "Dr. Sarah Wan specialises in AI ethics, governance, and algorithmic accountability. She completed her PhD at Stanford University after studying data science at University College London. Her seminars are current, discussion-rich, and challenge students to connect technical design choices with human impact.",
    'rkapoor': "Dr. Ravi Kapoor specialises in entrepreneurship strategy and innovation management. He completed his PhD at the University of Toronto after business study at the University of Birmingham. His classes are practical and fast-paced, with a strong focus on execution, storytelling, and real startup decision-making.",
    'lturner': "Dr. Laura Turner specialises in health psychology and behaviour change science. She completed her PhD at the University of Bristol after earlier study at the University of Glasgow. She brings warm, high-challenge teaching that helps students link theory to clinical and community outcomes.",
    'dnguyen': "Dr. David Nguyen specialises in software delivery, DevOps, and scalable backend systems. He completed his PhD at the National University of Singapore after studying engineering at the University of Leeds. His teaching is hands-on and collaborative, built around practical workflows students can apply immediately.",
    'ofarrell': "Dr. Olivia Farrell specialises in digital culture, media narratives, and online communities. She completed her PhD at the University of Melbourne after studying communication at the University of Nottingham. Her classes are lively, critical, and designed to sharpen analytical writing and confident discussion.",
    'mkhan': "Dr. Maya Khan specialises in epidemiology, prevention policy, and health equity. She completed her PhD at ETH Zurich after earlier study at the University of Sheffield. Her sessions connect evidence to policy in a way that feels practical, urgent, and genuinely motivating.",
    'tbrown': "Dr. Theo Brown specialises in corporate finance, market risk, and portfolio strategy. He completed his PhD at Massachusetts Institute of Technology after economics study at the University of Bristol. His teaching combines technical depth with applied decision-making used in real financial environments.",
    'ayamada': "Dr. Aiko Yamada specialises in human-centred design, service design, and product experimentation. She completed her PhD at the University of Cambridge after design study at the University of Manchester. Her studio-style classes are creative, rigorous, and centred on measurable user outcomes.",
    'fnunes': "Dr. Felipe Nunes specialises in international business operations and cross-border strategy. He completed his PhD at the University of Oxford after management study at the University of Leeds. His classes are globally minded, case-based, and focused on making strategic frameworks practical.",
    'cellis': "Dr. Chloe Ellis specialises in public law, governance, and policy implementation. She completed her PhD at University College London after legal study at Durham University. She teaches with clear structure and sharp argument coaching so students build confident legal reasoning quickly.",
    'bkwame': "Dr. Ben Kwame specialises in macroeconomic policy and applied econometrics. He completed his PhD at the University of Edinburgh after studying economics at the University of Glasgow. His lectures are interactive, data-led, and built to help students connect models to real-world outcomes.",
    'hlewis': "Dr. Hannah Lewis specialises in neuroscience, learning science, and evidence-based study strategy. She completed her PhD at Imperial College London after biological sciences study at the University of Nottingham. Her teaching helps students master both difficult content and smarter study habits.",
    'jpark': "Dr. Jun Park specialises in machine learning for healthcare and responsible clinical AI deployment. He completed his PhD at Stanford University after engineering study at King's College London. His classes combine technical challenge with practical healthcare context and strong ethical framing.",
    'asmith': "Dr. Amelia Smith specialises in mathematics education, assessment design, and inclusive pedagogy. She completed her PhD at the University of Toronto after mathematics study at the University of Warwick. Her teaching is supportive, high-standard, and focused on helping students communicate complex ideas clearly.",
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
    for data in FIXTURE_USERS:
        _create_single_fixture_user(data, stdout)

def _compute_random_counts(needed):
    target_teacher_count = 14
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

def create_random_users(stdout):
    needed = USER_COUNT - User.objects.count()
    if needed <= 0:
        stdout.write("Enough users already exist.")
        return
    student_count, teacher_count = _compute_random_counts(needed)
    stdout.write(
        f"Seeding {needed} random users "
        f"({student_count} students, {teacher_count} teachers)..."
    )
    new_users = _build_new_users(student_count, teacher_count)
    User.objects.bulk_create(new_users, ignore_conflicts=True)
    UserSettings.objects.bulk_create(build_settings_for_new_users())
