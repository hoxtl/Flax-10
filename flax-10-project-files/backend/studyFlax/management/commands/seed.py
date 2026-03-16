"""
Django management command for seeding the database.

Run with::

    python manage.py seed

Creates fixture users, random users, categories, tags, recurrence rules,
calendar events, modules, deadlines, enrollments, study sessions and theme
sessions. All operations are idempotent — running the command on an already-
seeded database will not produce duplicates.
"""

import random
from datetime import timedelta
from collections import defaultdict
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent, 
    UserSettings, Module, Enrollment, Deadline,
    Society, SocietyMembership, SocietyTag, SocietyEvent, SocietyImage, Reading
)
from studyFlax.models.tasks.taskModel import Task, TaskList
from studyFlax.models.groupwork.groupwork_models import GroupProject, GroupMembership

from studyFlax.fixtures.data_fixtures import (
    category_fixtures, tag_fixtures, recurrence_fixtures, module_fixtures,
    module_task_templates, personal_task_fixtures, task_list_fixtures,
    MODULE_PILL_COLORS, location_fixtures,
)
from studyFlax.fixtures.society_fixtures import build_society_seed_data, build_event_datetime
from studyFlax.fixtures.groupwork_fixtures import GROUP_PROJECT_FIXTURES, GROUP_TASK_TEMPLATES
from .seed_helpers import (
    build_users_list, build_settings_for_new_users, build_events_for_user,
    build_meal_events, build_today_afternoon_events, build_module_event, get_user_modules,
    build_lecture_events, create_lecture_event, build_deadlines_for_module,
    create_deadline_calendar_event, build_study_sessions_for_user,
    build_theme_sessions_for_user, build_readings_for_module, build_reading_user_history_,
)
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.timer.themeSessionModel import ThemeSession
from studyFlax.utils.reading_utils import update_reading_estimates


User = get_user_model()

class Command(BaseCommand):
    """Seeds the database with a structured, realistic dataset.

    Orchestrates the full seeding pipeline: users → categories/tags →
    events → modules → deadlines → enrollments → study sessions.
    All steps are idempotent.
    """

    help = 'Seeds the database with structured data based on fixtures and Faker.'

    USER_COUNT       = 72
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
        # ── Teachers ──
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

    def _load_shared_data(self):
        self.users      = list(User.objects.filter(is_staff=False))
        self.categories = list(Category.objects.all())
        self.tags       = list(Tag.objects.all())
        self.rules      = list(RecurrenceRule.objects.all())
        self.modules    = list(Module.objects.all())

    def handle(self, *args, **options):
        """Execute the full seeding pipeline in dependency order."""
        self.stdout.write(self.style.SUCCESS('Starting seeding process...'))
        self.create_admin_user()
        self.create_fixture_users()
        self.create_random_users()
        self.users = list(User.objects.filter(is_staff=False))
        self.create_recurrence_rules()
        self.create_categories()
        self.categories = list(Category.objects.all())
        self.create_tags()
        self._load_shared_data()
        self.create_events_for_users()
        self.create_modules()
        self.modules = list(Module.objects.all())
        self.create_deadlines()
        self.create_enrollments()
        self.create_tasks()
        self.create_societies()
        self.create_society_memberships()
        self.create_society_events()
        self.create_society_images()
        self.create_group_projects()
        self.create_group_memberships()
        self.create_group_tasks()
        self.create_study_sessions()
        self.create_readings()
        self.print_stats()  
        

    def create_admin_user(self):
        """Create the johndoe superuser if one does not already exist."""
        if User.objects.filter(username='johndoe').exists():
            return
        User.objects.create_superuser(
            username='johndoe', email='john.doe@kcl.ac.uk',
            password=self.DEFAULT_PASSWORD, first_name='John', last_name='Doe',
        )
        self.stdout.write(f"  {'johndoe':<12} admin")

    def create_fixture_users(self):
        """Create the named fixture users defined in FIXTURE_USERS, skipping duplicates."""
        self.stdout.write("Creating fixture users...")
        for data in self.FIXTURE_USERS:
            username = data['username']
            defaults = {k: v for k, v in data.items() if k not in ('is_superuser', 'is_staff')}
            user, _ = User.objects.get_or_create(username=username, defaults=defaults)

            user.email = data['email']
            user.first_name = data['first_name']
            user.last_name = data['last_name']
            user.is_superuser = data['is_superuser']
            user.is_staff = data['is_staff']

            if username in self.TEACHER_USERNAMES:
                user.role = 'teacher'
                user.bio = self.TEACHER_BIOS.get(
                    username,
                    "Lecturer at King's College London. Focused on practical teaching, clear feedback, and student success."
                )
            elif username == 'johndoe':
                user.role = 'student'
                user.bio = "Third-year medical student at King's with a focus on clinical anatomy and patient-centred care. I keep a tight weekly schedule with early morning revision blocks and evening review sessions. Outside lectures I volunteer at the campus health clinic and organise study groups for my cohort."
            else:
                user.role = 'student'
                user.bio = self.STUDENT_BIOS.get(
                    username,
                    random.choice(self.STUDENT_BIO_TEMPLATES),
                )

            user.set_password(self.DEFAULT_PASSWORD)
            user.save()
            role = self.ROLE_LABELS.get(data['username'], '')
            self.stdout.write(f"  {data['username']:<12} {role}")

    def create_random_users(self):
        """Top up the user table to USER_COUNT with randomly generated KCL students."""
        needed = self.USER_COUNT - User.objects.count()
        if needed <= 0:
            self.stdout.write("Enough users already exist.")
            return

        target_teacher_count = 14
        current_teacher_count = User.objects.filter(role='teacher').count()
        teacher_needed = max(0, target_teacher_count - current_teacher_count)
        random_teacher_count = min(teacher_needed, needed)
        random_student_count = needed - random_teacher_count

        self.stdout.write(
            f"Seeding {needed} random users "
            f"({random_student_count} students, {random_teacher_count} teachers)..."
        )
        new_users = []
        if random_student_count > 0:
            new_users.extend(build_users_list(random_student_count, role='student'))
        if random_teacher_count > 0:
            new_users.extend(build_users_list(random_teacher_count, role='teacher'))

        User.objects.bulk_create(new_users, ignore_conflicts=True)
        UserSettings.objects.bulk_create(build_settings_for_new_users())

    def create_recurrence_rules(self):
        """Seed the standard set of RecurrenceRule instances from fixtures."""
        self.stdout.write("Seeding recurrence rules...")
        for freq, interval in recurrence_fixtures:
            RecurrenceRule.objects.get_or_create(frequency=freq, interval=interval)

    def create_categories(self):
        """Seed default and randomly user-owned Category instances from fixtures."""
        self.stdout.write("Seeding categories...")
        for name, color, is_default in category_fixtures:
            user = random.choice(self.users) if not is_default and self.users and random.random() > 0.7 else None
            Category.objects.get_or_create(
                name=name, user=user,
                defaults={'color': color, 'is_default': is_default},
            )

    def create_tags(self):
        """Seed Tag instances from fixtures, associating each with a random user or category."""
        self.stdout.write("Seeding tags...")
        from faker import Faker
        f = Faker('en_GB')
        ROUTINE_COLOR = '#94a3b8'   # neutral slate so Academic (Sage) and Personal stand out
        WELLNESS_COLOR = '#94a3b8'
        # Module-specific pill colors for Action Hub (LS4101 Deep Earth Brown, LS4202 Muted Clay)
        for name, duration in tag_fixtures:
            category = random.choice(self.categories) if self.categories and random.random() > 0.3 else None
            user = (
                category.user if category and category.user
                else (random.choice(self.users) if self.users and random.random() > 0.7 else None)
            )
            color = ROUTINE_COLOR if name == 'Routine' else (WELLNESS_COLOR if name == 'Wellness' else f.hex_color())
            Tag.objects.get_or_create(
                name=name, user=user,
                defaults={'category': category, 'default_duration': duration, 'color': color},
            )
        # Create display tags for LS4101/LS4202 so module pills can use distinct colors
        for code, pill_color in MODULE_PILL_COLORS.items():
            Tag.objects.get_or_create(
                name=code, user=None,
                defaults={'category': None, 'default_duration': 0, 'color': pill_color},
            )

    def create_events_for_users(self):
        """Seed personal and meal CalendarEvents for every non-staff user."""
        self.stdout.write("Seeding events for users...")
        total = 0
        for i, user in enumerate(self.users):
            print(f"  Processing user {i+1}/{len(self.users)}: {user.username}", end='\r')
            personal_events = build_events_for_user(user, self.tags, self.rules, 0)
            CalendarEvent.objects.bulk_create(personal_events)
            meal_events = build_meal_events(user, self.tags)
            CalendarEvent.objects.bulk_create(meal_events)
            today_events = build_today_afternoon_events(user, self.tags)
            CalendarEvent.objects.bulk_create(today_events)
            total += len(personal_events) + len(meal_events) + len(today_events)
        print(f"  Created {total} events across {len(self.users)} users.          ")

    def _create_module(self, code, name, description, teacher, weekly_rule):
        if not Module.objects.filter(module_code=code).exists():
            Module.objects.create(**build_module_event(code, name, description, teacher, weekly_rule))

    def _get_module_prefix(self, module_code):
        prefix_chars = []
        for ch in module_code:
            if ch.isalpha():
                prefix_chars.append(ch)
            else:
                break
        return ''.join(prefix_chars) or module_code[:2]

    def _build_extra_module_entries(self, prefix, existing_codes, target_count=8):
        """Generate extra modules so each course prefix reaches target_count."""
        extras = []
        base_numbers = [4606, 4707, 4808]
        extra_names = [
            "Advanced Topics",
            "Applied Practice",
            "Research Project",
        ]

        for i in range(max(0, target_count)):
            if i >= len(base_numbers):
                break
            code = f"{prefix}{base_numbers[i]}"
            if code in existing_codes:
                continue
            name = f"{extra_names[i]} in {prefix}"
            description = (
                f"Extended {prefix} module focused on advanced concepts, applied methods, "
                "and real-world case work."
            )
            extras.append((code, name, description))
        return extras

    def _build_modules_with_target_per_prefix(self, fixtures, target_count=8):
        grouped = defaultdict(list)
        for code, name, description in fixtures:
            grouped[self._get_module_prefix(code)].append((code, name, description))

        expanded = []
        for prefix, entries in grouped.items():
            expanded.extend(entries)
            if len(entries) >= target_count:
                continue
            existing_codes = {code for code, _, _ in entries}
            needed = target_count - len(entries)
            expanded.extend(self._build_extra_module_entries(prefix, existing_codes, target_count=needed))
        return expanded

    def create_modules(self):
        """Seed the KCL module catalogue, distributing modules across teacher accounts."""
        self.stdout.write("Seeding modules...")
        teachers = list(User.objects.filter(role='teacher'))
        if not teachers:
            teachers = [User.objects.filter(is_superuser=True).first()]
        weekly_rule = RecurrenceRule.objects.filter(frequency='weekly', interval=1).first()
        all_module_entries = self._build_modules_with_target_per_prefix(module_fixtures, target_count=5)
        for i, (code, name, description) in enumerate(all_module_entries):
            teacher = teachers[i % len(teachers)]
            self._create_module(code, name, description, teacher, weekly_rule)

    def create_deadlines(self):
        """Seed assessment deadlines for every module in the database."""
        self.stdout.write("Seeding deadlines...")
        deadlines_to_create = []
        for module in self.modules:
            deadlines_to_create.extend(build_deadlines_for_module(module))
        Deadline.objects.bulk_create(deadlines_to_create, ignore_conflicts=True)
        self.stdout.write(f"  Created {len(deadlines_to_create)} deadlines.")

    def _should_enroll(self, user, module):
        return not Enrollment.objects.filter(student=user, module=module).exists()

    def _enroll_if_needed(self, user, module, enrollments):
        if self._should_enroll(user, module):
            enrollments.append(Enrollment(student=user, module=module))

    def _process_module(self, user, module, lecture_tag, enrollments):
        self._enroll_if_needed(user, module, enrollments)
        for u, mod, start, end, tag in build_lecture_events(user, module, lecture_tag):
            create_lecture_event(u, mod, start, end, tag)
        for deadline in module.deadlines.all():
            create_deadline_calendar_event(user, deadline)

    def _process_user_modules(self, user, lecture_tag, enrollments):
        core, extras = get_user_modules(user, self.modules)
        for module in core:
            self._process_module(user, module, lecture_tag, enrollments)
        for module in extras:
            self._process_module(user, module, lecture_tag, enrollments)

    def create_enrollments(self):
        """Enroll every user in their major's core modules plus one elective, and seed lecture events."""
        self.stdout.write("Seeding enrollments and lecture events...")
        lecture_tag = next((t for t in self.tags if t.name == 'Lecture'), None)
        enrollments = []
        for user in User.objects.all().select_related('settings'):
            self._process_user_modules(user, lecture_tag, enrollments)
        Enrollment.objects.bulk_create(enrollments, ignore_conflicts=True)
        self.stdout.write(f"  Created {len(enrollments)} enrollments.")

    def create_tasks(self):
        self.stdout.write("Seeding tasks...")
        now   = timezone.now()
        total = 0

        for user in self.users:
            if Task.objects.filter(user=user).exists():
                continue

            # ── Create all task lists for this user ──
            lists_by_name = {}
            for list_name, list_category, list_emoji in task_list_fixtures:
                tl, _ = TaskList.objects.get_or_create(
                    user=user,
                    name=list_name,
                    defaults={"category": list_category},
                )
                lists_by_name[list_name] = tl

            # Fallback references
            uni_list      = lists_by_name.get("University")
            personal_list = lists_by_name.get("Personal")

            # ── Module tasks (unique per enrollment; full module code then prefix) ──
            enrolled_modules = list(
                Enrollment.objects.filter(student=user).select_related('module')
            )
            odd_days  = [1, 3, 5]   # LS4101
            even_days = [2, 4, 6]   # LS4202
            for enrollment in enrolled_modules:
                mod    = enrollment.module
                prefix = mod.module_code[:2]
                templates = module_task_templates.get(
                    mod.module_code,
                    module_task_templates.get(prefix, []),
                )
                for i, (title_tmpl, description, priority, estimated_blocks, days_from_now) in enumerate(templates):
                    if mod.module_code == 'LS4101':
                        days_from_now = odd_days[i % len(odd_days)]
                        # Higher XP for Writing-type (Lab Report, Microscopy, Cell Division)
                        if any(x in title_tmpl.lower() for x in ('lab', 'microscopy', 'cell division')):
                            estimated_blocks = estimated_blocks + 1
                    elif mod.module_code == 'LS4202':
                        days_from_now = even_days[i % len(even_days)]
                        # Higher XP for Problem Set-type (Enzyme, Protein Folding, Metabolic)
                        if any(x in title_tmpl.lower() for x in ('enzyme', 'protein folding', 'metabolic')):
                            estimated_blocks = estimated_blocks + 1
                    title = title_tmpl.format(module=mod.module_code, module_name=mod.module_name)
                    due   = (now + timedelta(days=days_from_now)).replace(
                        hour=23, minute=59, second=0, microsecond=0
                    )
                    Task.objects.create(
                        user=user,
                        task_list=uni_list,
                        module=mod,
                        title=title,
                        description=description,
                        priority=priority,
                        due_date=due,
                        estimated_blocks=estimated_blocks,
                        completed=False,
                    )
                    total += 1

            # ── Personal tasks ──
            for title, description, priority, estimated_blocks, days_from_now, list_name in personal_task_fixtures:
                due  = (now + timedelta(days=days_from_now)).replace(
                    hour=23, minute=59, second=0, microsecond=0
                )
                task_list = lists_by_name.get(list_name, personal_list)
                Task.objects.create(
                    user=user,
                    task_list=task_list,
                    module=None,
                    title=title,
                    description=description,
                    priority=priority,
                    due_date=due,
                    estimated_blocks=estimated_blocks,
                    completed=False,
                )
                total += 1

        self.stdout.write(f"  Created {total} tasks.")

    def create_study_sessions(self):
        """Seed StudySession and ThemeSession records for named fixture users.

        Each fixture user is assigned a profile ('balanced', 'night_owl', or
        'consistent') that controls session timing and volume across the past
        90 days. Sessions that already exist are skipped to keep the command
        idempotent.
        """
        self.stdout.write("Seeding study sessions and theme sessions...")

        # map username → (study_profile, theme_profile)
        PROFILES = {
            'janedoe': ('balanced',    'balanced'),
            'charlie': ('night_owl',   'night_owl'),
            'amiller': ('consistent',  'consistent'),
            'srahwan': ('balanced',    'balanced'),
            'hpatel':  ('consistent',  'consistent'),
            'echen':   ('night_owl',   'night_owl'),
            'jmurphy': ('balanced',    'consistent'),
            'swan':    ('balanced',    'balanced'),
            'rkapoor': ('consistent',  'consistent'),
            'lturner': ('night_owl',   'balanced'),
        }

        total_study = 0
        total_theme = 0

        for username, (study_profile, theme_profile) in PROFILES.items():
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                continue

            # Study sessions — skip days already seeded
            study_sessions = [
                s for s in build_study_sessions_for_user(user, study_profile)
                if not StudySession.objects.filter(
                    user=user, study_block_id=s.study_block_id
                ).exists()
            ]
            StudySession.objects.bulk_create(study_sessions, ignore_conflicts=True)
            total_study += len(study_sessions)

            # Theme sessions — skip slots already seeded
            theme_sessions = [
                t for t in build_theme_sessions_for_user(user, theme_profile)
                if not ThemeSession.objects.filter(
                    user=user, started_at=t.started_at
                ).exists()
            ]
            ThemeSession.objects.bulk_create(theme_sessions, ignore_conflicts=True)
            total_theme += len(theme_sessions)

        self.stdout.write(f"  Created {total_study} study sessions, {total_theme} theme sessions.")

    def create_societies(self):
        self.stdout.write("Seeding societies...")
        for data in build_society_seed_data():
            society = self._create_society_from_config(data)
            self._seed_society_tags_from_config(society, data.get('tags', []))

    def _create_society_from_config(self, data):
        status = random.choice(['approved', 'pending', 'rejected', 'none'])
        defaults = {
            'bio': data['bio'], 'about': data['about'],
            'categories': data.get('categories', []),
            'ratification_status': status, 'is_ratified': (status == 'approved')
        }
        if data.get('image'):
            defaults['image'] = data['image']
        society, _ = Society.objects.update_or_create(name=data['name'], defaults=defaults)
        return society

    def _seed_society_tags_from_config(self, society, tag_labels):
        from faker import Faker
        f = Faker('en_GB')
        for label in tag_labels:
            SocietyTag.objects.get_or_create(society=society, label=label, defaults={'color': f.hex_color()})

    def _get_society_config(self, society):
        return next((s for s in build_society_seed_data() if s['name'] == society.name), None)

    def _seed_events_for_society(self, society):
        config = self._get_society_config(society)
        if not config:
            return
        tags = list(society.tags.all())
        for event_template in config.get('events', []):
            self._create_event_from_template(society, event_template, tags)

    def _create_event_from_template(self, society, template, tags):
        title, desc, hour, duration, recurrence, day = template
        start, end = build_event_datetime(hour, duration, day)
        SocietyEvent.objects.get_or_create(
            society=society, title=title,
            defaults=self._build_event_defaults(desc, start, end, recurrence, tags)
        )

    def _build_event_defaults(self, desc, start, end, recurrence, tags):
        return {
            'description': desc, 'location': random.choice(location_fixtures),
            'start_time': start, 'end_time': end,
            'recurrence': recurrence or 'none',
            'recurrence_end_date': (start + timedelta(days=90)).date() if recurrence else None,
            'tag': random.choice(tags) if tags else None
        }

    def _seed_images_for_society(self, society):
        self._set_cover_image(society)
        self._add_extra_images(society)

    def _set_cover_image(self, society):
        if not society.image:
            return
        SocietyImage.objects.filter(society=society, is_cover=True).delete()
        SocietyImage.objects.create(society=society, is_cover=True, url=society.image)

    def _add_extra_images(self, society):
        current_count = society.images.count()
        for i in range(5 - current_count):
            SocietyImage.objects.create(
                society=society, url=f"https://picsum.photos/seed/{society.name}{i}/800/600", is_cover=False
            )

    def create_society_memberships(self):
        self.stdout.write("Seeding society memberships...")
        # Product rule: teachers should not be auto-joined to societies.
        SocietyMembership.objects.filter(user__role='teacher').delete()

        student_users = list(User.objects.filter(is_staff=False, role='student'))
        admin_counts = {u.id: 0 for u in student_users}
        member_counts = {u.id: 0 for u in student_users}
        for society in Society.objects.all():
            self._seed_society_members(society, admin_counts, member_counts, student_users)

    def _seed_society_members(self, society, admin_counts, member_counts, student_users):
        admin = self._pick_admin(admin_counts, student_users)
        if not admin:
            return
        self._add_admin_membership(society, admin, admin_counts)
        self._seed_regular_members(society, admin, member_counts, student_users)

    def _pick_admin(self, admin_counts, student_users):
        eligible = [u for u in student_users if admin_counts[u.id] < 3]
        return random.choice(eligible) if eligible else None

    def _add_admin_membership(self, society, admin, admin_counts):
        SocietyMembership.objects.get_or_create(
            user=admin, society=society, defaults={'role': 'admin'}
        )
        society.admin_emails = admin.email
        society.save()
        admin_counts[admin.id] += 1

    def _seed_regular_members(self, society, admin, member_counts, student_users):
        eligible = [u for u in student_users if u.id != admin.id and member_counts[u.id] < 5]
        count = min(random.randint(5, 15), len(eligible))
        members = random.sample(eligible, count)
        for member in members:
            SocietyMembership.objects.get_or_create(
                user=member, society=society, defaults={'role': 'member'}
            )
            member_counts[member.id] += 1

    def create_society_events(self):
        self.stdout.write("Seeding society events...")
        for society in Society.objects.all():
            self._seed_events_for_society(society)

    def create_society_images(self):
        self.stdout.write("Seeding society images...")
        for society in Society.objects.all():
            self._seed_images_for_society(society)

    def create_group_projects(self):
        self.stdout.write("Seeding group projects...")
        now = timezone.now()
        fixture_user_objs = {u.username: u for u in User.objects.filter(username__in=['johndoe', 'janedoe', 'charlie'])}
        
        for name, code_prefix, desc in GROUP_PROJECT_FIXTURES:
            owner_username = random.choice(['johndoe', 'janedoe', 'charlie'])
            owner = fixture_user_objs.get(owner_username)
            if not owner: continue
            
            due = (now + timedelta(days=random.randint(20, 45))).replace(hour=23, minute=59)
            project, created = GroupProject.objects.get_or_create(
                name=name,
                defaults={
                    'owner': owner,
                    'course_code': f"{code_prefix}{random.randint(4000, 6000)}",
                    'deadline': due
                }
            )
            if created:
                # Add owner to membership too
                GroupMembership.objects.get_or_create(project=project, user=owner, defaults={'role': 'owner'})

    def create_group_memberships(self):
        self.stdout.write("Seeding group memberships...")
        projects = list(GroupProject.objects.all())
        students = list(User.objects.filter(username__in=['johndoe', 'janedoe', 'charlie']))
        
        for project in projects:
            # Add 1-2 more fixture users as members
            potential = [s for s in students if s != project.owner]
            members = random.sample(potential, random.randint(1, min(2, len(potential))))
            for m in members:
                GroupMembership.objects.get_or_create(project=project, user=m, defaults={'role': 'member'})

    def create_group_tasks(self):
        self.stdout.write("Seeding group tasks with assignments and statuses...")
        projects = GroupProject.objects.all()
        statuses = ['todo', 'in_progress', 'done']
        
        for project in projects:
            members = [m.user for m in project.memberships.all()]
            due = project.deadline or (timezone.now() + timedelta(days=30))
            
            for t_title, t_desc, t_priority, t_blocks in GROUP_TASK_TEMPLATES:
                # Randomly pick status
                status = random.choice(statuses)
                is_completed = (status == 'done')
                completed_at = timezone.now() - timedelta(days=random.randint(0, 5)) if is_completed else None
                
                task = Task.objects.create(
                    user=project.owner,
                    group_project=project,
                    title=t_title,
                    description=t_desc,
                    priority=t_priority,
                    estimated_blocks=t_blocks,
                    status=status,
                    completed=is_completed,
                    completed_at=completed_at,
                    due_date=due - timedelta(days=random.randint(1, 15))
                )
                
                # Assign to 1-2 random members
                assignees = random.sample(members, random.randint(1, min(2, len(members))))
                task.assigned_to.set(assignees)
    
    def create_readings(self):
        self.stdout.write("Seeding readings..")
        self._seed_readings_for_modules()
        self._seed_reading_history_janedoe()
        self._seed_reading_history_random_students()
        self.stdout.write( f" {Reading.objects.count()} total readings in database.")
    
    def _seed_readings_for_modules(self):
        readings = []
        for module in self.modules:
            readings.extend(build_readings_for_module(module))
        Reading.objects.bulk_create(readings, ignore_conflicts=True)
        self.stdout.write(f" Created {len(readings)} readings across {len(self.modules)} modules.")
    
    def _seed_reading_history_user(self, user):
        reading_list = TaskList.objects.filter(user=user, name="Reading List").first()
        if not reading_list:
            return 0
        module_ids = Enrollment.objects.filter(student=user).values_list('module', flat=True)
        modules = [m for m in self.modules if m.id in module_ids]
        tasks = build_reading_user_history_(user, modules, reading_list)
        Task.objects.bulk_create(tasks, ignore_conflicts=True)
        if tasks:
            update_reading_estimates(user)
        return len(tasks)
    
    def _seed_reading_history_janedoe(self):
        try: 
            jane = User.objects.get(username='janedoe')
        except User.DoesNotExist:
            return
        count = self._seed_reading_history_user(jane)
        self.stdout.write(f" janedoe: {count} completed reading tasks and speed is personalised")

    def _seed_reading_history_random_students(self):
        students = list(User.objects.filter(role='student').exclude(username__in=['janedoe', 'charlie']))
        sample = random.sample(students, min(3, len(students)))
        count = sum(1 for s in sample if self._seed_reading_history_user(s) > 0)
        self.stdout.write(f" {count} random students seeded with reading history.")

    def print_stats(self):
        """Print a summary of all fixture users and database record counts."""
        div = "─" * 40
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write(self.style.SUCCESS("  Seeding complete"))
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write("  Fixture users (password: 1234)")
        for user, role in [('johndoe', 'admin'), ('janedoe', 'student'), ('charlie', 'student')]:
            self.stdout.write(f"  {user:<12}  {role}")
        self.stdout.write("  Database")
        stats = [
            ("Users",       User.objects.count()),
            ("Modules",     Module.objects.count()),
            ("Enrollments", Enrollment.objects.count()),
            ("Deadlines",   Deadline.objects.count()),
            ("Tasks",       Task.objects.count()),
            ("Group Projects", GroupProject.objects.count()),
            ("Categories",  Category.objects.count()),
            ("Tags",        Tag.objects.count()),
            ("Events",      CalendarEvent.objects.count()),
            ("Societies",   Society.objects.count()),
            ("Readings",   Reading.objects.count()),
        ]
        for label, count in stats:
            self.stdout.write(f"  {label:<14}  {count}")
        self.stdout.write(self.style.SUCCESS(div))
