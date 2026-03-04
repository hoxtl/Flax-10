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
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent,
    UserSettings, Module, Enrollment, Deadline,
    Society, SocietyMembership, SocietyTag, SocietyEvent, SocietyImage,
    TaskList, Task,
)
from studyFlax.fixtures.data_fixtures import (
    category_fixtures, tag_fixtures, recurrence_fixtures,
    module_fixtures, location_fixtures
)
from studyFlax.fixtures.society_fixtures import build_society_seed_data, build_event_datetime
from .seed_helpers import (
    build_users_list, build_settings_for_new_users, build_events_for_user,
    build_meal_events, build_module_event, get_user_modules,
    build_lecture_events, create_lecture_event, build_deadlines_for_module,
    create_deadline_calendar_event, build_study_sessions_for_user, 
    build_theme_sessions_for_user,
)
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.timer.themeSessionModel import ThemeSession

User = get_user_model()

class Command(BaseCommand):
    """Seeds the database with a structured, realistic dataset.

    Orchestrates the full seeding pipeline: users → categories/tags →
    events → modules → deadlines → enrollments → study sessions.
    All steps are idempotent.
    """

    help = 'Seeds the database with structured data based on fixtures and Faker.'

    USER_COUNT       = 25
    DEFAULT_PASSWORD = '1234'

    FIXTURE_USERS = [
        {'username': 'johndoe', 'email': 'john.doe@kcl.ac.uk',  'first_name': 'John',    'last_name': 'Doe',    'is_superuser': True,  'is_staff': True},
        {'username': 'janedoe', 'email': 'jane.doe@kcl.ac.uk',  'first_name': 'Jane',    'last_name': 'Doe',    'is_superuser': False, 'is_staff': False},
        {'username': 'charlie', 'email': 'charlie@kcl.ac.uk',   'first_name': 'Charlie', 'last_name': 'Smith',  'is_superuser': False, 'is_staff': False},
        {'username': 'amiller', 'email': 'a.miller@kcl.ac.uk',  'first_name': 'Alice',   'last_name': 'Miller', 'is_superuser': False, 'is_staff': False},
        {'username': 'srahwan', 'email': 's.rahwan@kcl.ac.uk',  'first_name': 'Sam',     'last_name': 'Rahwan', 'is_superuser': False, 'is_staff': False},
        {'username': 'hpatel',  'email': 'h.patel@kcl.ac.uk',   'first_name': 'Hina',    'last_name': 'Patel',  'is_superuser': False, 'is_staff': False},
        {'username': 'echen',   'email': 'e.chen@kcl.ac.uk',    'first_name': 'Eric',    'last_name': 'Chen',   'is_superuser': False, 'is_staff': False},
        {'username': 'jmurphy', 'email': 'j.murphy@kcl.ac.uk',  'first_name': 'James',   'last_name': 'Murphy', 'is_superuser': False, 'is_staff': False},
    ]

    ROLE_LABELS = {
        'johndoe': 'admin',
        'janedoe': 'student', 'charlie': 'student',
        'amiller': 'teacher', 'srahwan': 'teacher',
        'hpatel':  'teacher', 'echen':   'teacher', 'jmurphy': 'teacher',
    }

    TEACHER_USERNAMES = {'amiller', 'srahwan', 'hpatel', 'echen', 'jmurphy'}

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
        self.create_societies()
        self.create_society_memberships()
        self.create_society_events()
        self.create_society_images()
        self.create_task_lists()
        self.create_tasks()
        self.create_study_sessions()
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
            if User.objects.filter(username=data['username']).exists():
                continue
            user = User(**{k: v for k, v in data.items() if k not in ('is_superuser', 'is_staff')})
            user.is_superuser = data['is_superuser']
            user.is_staff     = data['is_staff']
            if data['username'] in self.TEACHER_USERNAMES:
                user.role = 'teacher'
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
        self.stdout.write(f"Seeding {needed} random users...")
        User.objects.bulk_create(build_users_list(needed), ignore_conflicts=True)
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
        for name, duration in tag_fixtures:
            if name == 'Lecture':
                self._create_lecture_tag(name, duration)
            else:
                self._create_regular_tag(name, duration, f)

    def _create_lecture_tag(self, name, duration):
        Tag.objects.get_or_create(
            name=name, user=None,
            defaults={'default_duration': duration, 'color': '#4A90D9', 'is_default': True},
        )
        self._create_system_tags()

    def _create_system_tags(self):
        from studyFlax.views.calendar.system_tags import SYSTEM_TAG_CONFIG
        for name, config in SYSTEM_TAG_CONFIG.items():
            Tag.objects.get_or_create(
                name=name, user=None,
                defaults={'default_duration': config['duration'], 'color': config['color'], 'is_default': True},
            )

    def _create_regular_tag(self, name, duration, faker):
        category = random.choice(self.categories) if self.categories and random.random() > 0.3 else None
        user = self._get_tag_user(category)
        Tag.objects.get_or_create(
            name=name, user=user,
            defaults={'category': category, 'default_duration': duration, 'color': faker.hex_color()},
        )

    def _get_tag_user(self, category):
        if category and category.user:
            return category.user
        if self.users and random.random() > 0.7:
            return random.choice(self.users)
        return None

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
            total += len(personal_events) + len(meal_events)
        print(f"  Created {total} events across {len(self.users)} users.          ")

    def _create_module(self, code, name, description, teacher, weekly_rule):
        if not Module.objects.filter(module_code=code).exists():
            Module.objects.create(**build_module_event(code, name, description, teacher, weekly_rule))

    def create_modules(self):
        """Seed the KCL module catalogue, distributing modules across teacher accounts."""
        self.stdout.write("Seeding modules...")
        teachers = list(User.objects.filter(role='teacher'))
        if not teachers:
            teachers = [User.objects.filter(is_superuser=True).first()]
        weekly_rule = RecurrenceRule.objects.filter(frequency='weekly', interval=1).first()
        for i, (code, name, description) in enumerate(module_fixtures):
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

    def create_task_lists(self):
        """Create default task lists for each non-staff user (idempotent)."""
        self.stdout.write("Seeding task lists...")
        created = 0
        # Lists relevant for a uni student: All Tasks (aggregate), then category lists
        default_lists = [
            ("All Tasks", None),
            ("Personal", "#8C9A86"),
            ("University", "#4A90D9"),
            ("Reading list", "#0e7490"),
            ("Internships", "#B45309"),
            ("Finance", "#15803d"),
            ("Budgeting", "#7e22ce"),
        ]
        for user in self.users:
            for order, (name, color) in enumerate(default_lists):
                existing = TaskList.objects.filter(user=user, name=name).first()
                if not existing:
                    TaskList.objects.create(user=user, name=name, color=color, order=order)
                    created += 1
        self.stdout.write(f"  Created {created} task lists.")

    def create_tasks(self):
        """Create ~5–6 sample tasks per list for fixture users (~30 total; idempotent: skip if user already has tasks)."""
        self.stdout.write("Seeding tasks...")
        from django.utils import timezone
        from .seed_helpers import get_user_modules
        now = timezone.now()
        # ~5–6 tasks per list for ~30 total; (title, days_from_now, priority, description). University tasks get modules for pill display.
        TASKS_BY_LIST = {
            "Personal": [
                ("Do the grocery shopping for the week", 0, "medium", "Get everything you need for meals and snacks."),
                ("Go to the gym this evening", 1, "low", "Even a short session helps with focus and sleep."),
                ("Call family at the weekend", 0, "medium", "Catch up and check in."),
                ("Put on a load of laundry", 1, "low", "Stay on top of washing so you have clean clothes."),
                ("Meal prep for Monday to Wednesday", 2, "medium", "Prep a few days of lunches or dinners to save time."),
                ("Sort out the room and desk", 3, "low", "A tidy space helps you focus."),
                ("Book a dentist check-up", 7, "low", "Get it in the diary before the term gets busy."),
                ("Reply to urgent emails", 0, "high", "Clear the inbox so nothing slips."),
                ("Plan what to do at the weekend", 5, "low", "Mix rest with one or two productive things."),
                ("Update CV with latest project", 4, "medium", "Add recent work and skills so it's ready for applications."),
                ("Buy a birthday gift for Mum", 10, "medium", "Order or pick something in good time."),
                ("Organise the desk and cables", 2, "low", "Makes studying and working easier."),
                ("Cancel the unused streaming subscription", 1, "low", "Trim recurring costs."),
                ("Book a haircut for next week", 14, "low", "Schedule it before the week fills up."),
                ("Review monthly goals and progress", 7, "medium", "See what's done and what to prioritise next."),
            ],
            "University": [
                ("Review lecture notes from week 3", 0, "medium", "Consolidate the main concepts and note any gaps."),
                ("Complete problem set 2 by Friday", 1, "high", "Work through each question and show your reasoning."),
                ("Read chapter 2 and take notes", 2, "medium", "Focus on key definitions and examples."),
                ("Prepare the group presentation slides", 1, "urgent", "Draft slides and assign sections; leave time for rehearsal."),
                ("Submit the ethics assignment on KEATS", 0, "high", "Final read-through then submit before the deadline."),
                ("Prep for the tutorial on Tuesday", 1, "medium", "Do the set questions and note anything to ask."),
                ("Practice past papers for the January exam", 3, "low", "Timed conditions to get used to exam pressure."),
                ("Draft the introduction and outline for the essay", 5, "high", "Get the structure and argument clear before writing the body."),
                ("Write up the lab report for experiment 2", 2, "urgent", "Methods, results, and discussion; include figures and references."),
                ("Make revision notes for the calculus module", 4, "medium", "Summarise theorems and worked examples."),
                ("Finish the tutorial questions for week 4", 1, "high", "Complete all parts and check against solutions if available."),
                ("Watch the week 5 lecture recording", 0, "medium", "Take notes and pause where you need to."),
                ("Research literature for the dissertation proposal", 7, "medium", "Find key papers and start a short lit review."),
                ("Compile the bibliography in APA style", 3, "low", "Use your reference manager and check formatting."),
                ("Proofread chapter 2 of the essay", 1, "high", "Check flow, grammar, and that all sources are cited."),
            ],
            "Reading list": [
                ("Finish the set reading for week 6", 2, "medium", "Complete the chapter and note discussion points."),
                ("Read chapter 4 of the core textbook", 1, "high", "Focus on the main arguments and examples."),
                ("Skim the recommended paper for the seminar", 0, "low", "Get the main idea and one or two takeaways."),
                ("Take notes on the Rousseau extract", 3, "medium", "Summarise the argument and your own response."),
                ("Read the case study before the tutorial", 1, "high", "Understand the scenario and possible approaches."),
                ("Catch up on last week's reading", 0, "medium", "Prioritise the most relevant sections."),
                ("Read the introduction to the new module", 5, "low", "Get an overview of themes and assessment."),
                ("Summarise the key arguments from the paper", 2, "medium", "One paragraph per main point."),
                ("Read the play before the theatre trip", 7, "low", "Familiarise yourself with the plot and characters."),
                ("Go through the further reading list", 4, "low", "Pick one or two to add to your list."),
                ("Read the chapter on probability theory", 3, "medium", "Work through the examples as you go."),
                ("Finish the novel for the book club", 10, "low", "Leave time to note quotes and questions."),
                ("Read the policy brief for the seminar", 1, "high", "Identify the recommendation and supporting evidence."),
                ("Review the reading list for the essay", 5, "medium", "Tick off done and prioritise what to read next."),
                ("Read the primary source for the source analysis", 2, "high", "Annotate and note context and bias."),
            ],
            "Internships": [
                ("Update LinkedIn with the new project", 0, "medium", "Add a short description and any skills or outcomes."),
                ("Apply to three graduate roles", 1, "high", "Tailor each application and cover letter."),
                ("Prepare answers for the interview on Thursday", 2, "urgent", "Practice STAR examples and company research."),
                ("Follow up with the recruiter by email", 3, "medium", "Thank them and confirm next steps."),
                ("Draft a cover letter for the consulting role", 1, "high", "Match your experience to the job description."),
                ("Research the company before the interview", 0, "medium", "Mission, recent news, and role requirements."),
                ("Practice the case study for the assessment centre", 4, "medium", "Time yourself and structure your approach."),
                ("Send a thank-you email after the interview", 0, "low", "Send within 24 hours."),
                ("Update the portfolio with the latest work", 5, "medium", "Add projects and a short reflection."),
                ("Prep for the networking event next week", 7, "low", "Prepare a short pitch and questions to ask."),
                ("Review the job description and match skills", 0, "medium", "List evidence for each requirement."),
                ("Prepare STAR examples for competency questions", 2, "high", "Have 3–4 strong examples ready."),
                ("Schedule a mock interview with the careers service", 3, "medium", "Book a slot and prepare as for a real interview."),
                ("Update CV for the finance role", 1, "high", "Emphasise relevant modules and experience."),
                ("Check the status of the application", 2, "low", "Log in and note any next steps."),
            ],
            "Finance": [
                ("Check the bank balance and pending payments", 0, "medium", "Make sure nothing unexpected is going out."),
                ("Pay the rent before the due date", 0, "urgent", "Avoid late fees and mark as paid."),
                ("Submit the expense claim for the trip", 1, "high", "Attach receipts and submit via the portal."),
                ("Review subscriptions and cancel unused ones", 2, "low", "Trim monthly outgoings."),
                ("Transfer £50 into the savings account", 0, "medium", "Keep the habit of saving a little each month."),
                ("Sort receipts and log them for tax", 3, "low", "File digitally and note any tax-deductible items."),
                ("Apply for student finance maintenance loan", 5, "high", "Complete the form and upload any documents."),
                ("Claim the refund for the cancelled course", 7, "medium", "Follow the refund process and keep a record."),
                ("Compare insurance quotes for next year", 4, "low", "Check cover and excess; renew or switch."),
                ("Set up the standing order for the rent", 1, "medium", "Use the correct reference and date."),
                ("Reconcile the bank statements", 2, "low", "Match transactions and flag anything odd."),
                ("Research grants and bursaries to apply for", 10, "medium", "Note deadlines and requirements."),
                ("Pay the utility bill before the weekend", 1, "high", "Avoid disconnection or late charges."),
                ("Update tax details with the employer", 14, "low", "Submit the form so your code is correct."),
                ("Review the budget for this term", 0, "medium", "Adjust categories and set a realistic target."),
            ],
            "Budgeting": [
                ("Log this week's spending in the tracker", 0, "medium", "Record what you spent and which category."),
                ("Plan the monthly budget for March", 1, "high", "Set limits per category and a small buffer."),
                ("Cut discretionary spend for the next two weeks", 2, "medium", "Identify what to pause and stick to it."),
                ("Set a savings goal for the summer", 0, "low", "Decide an amount and open or use a savings pot."),
                ("Compare supermarket prices for the big shop", 1, "low", "Check deals and own-brand options."),
                ("Meal plan to save on food this week", 3, "medium", "Plan meals and a short list to reduce waste."),
                ("Cancel the unused gym membership", 1, "low", "Cancel in line with the contract."),
                ("Track subscriptions and cancel one", 0, "medium", "Pick one you rarely use and cancel."),
                ("Allocate leftover money to savings", 2, "low", "Move any surplus at the end of the month."),
                ("Review last month's spending by category", 0, "medium", "See where the money went and adjust."),
                ("Set a weekly spending limit", 0, "high", "Choose an amount and track daily."),
                ("Find student discounts for the big purchase", 5, "low", "Check UNiDAYS, student beans, and direct offers."),
                ("Plan the budget for the big purchase", 14, "medium", "Work out how much to set aside each week."),
                ("Check the emergency fund balance", 7, "low", "Top up if needed."),
                ("Reduce eating out to twice this week", 1, "medium", "Plan home meals for the rest."),
            ],
        }
        fixture_usernames = [u["username"] for u in self.FIXTURE_USERS]
        created = 0
        for user in User.objects.filter(username__in=fixture_usernames):
            if Task.objects.filter(user=user).exists():
                continue
            lists = list(TaskList.objects.filter(user=user).order_by("order", "id"))
            if not lists:
                continue
            # Map list name -> list obj (exclude "All Tasks" for assigning tasks to a specific list)
            list_by_name = {l.name: l for l in lists}
            core_mods, extra_mods = get_user_modules(user, self.modules)
            user_modules = list(core_mods) + list(extra_mods)
            for list_name, task_specs in TASKS_BY_LIST.items():
                task_list = list_by_name.get(list_name)
                if not task_list:
                    continue
                # ~5–6 tasks per list (~30 total)
                chosen = random.sample(task_specs, min(random.randint(5, 6), len(task_specs)))
                for title, days_from_now, priority, description in chosen:
                    due = (now + timedelta(days=days_from_now)).replace(hour=random.choice([9, 14, 18]), minute=0, second=0, microsecond=0) if days_from_now is not None else None
                    if random.random() < 0.15:
                        due = None
                    module = random.choice(user_modules) if list_name == "University" and user_modules and random.random() < 0.85 else None
                    Task.objects.create(
                        user=user,
                        task_list=task_list,
                        module=module,
                        title=title,
                        description=description or "",
                        completed=random.random() < 0.2,
                        due_date=due,
                        priority=priority,
                        estimated_blocks=random.choice([1, 2, 3, 4]),
                        time_spent_minutes=random.choice([0, 0, 0, 25, 50]) if random.random() < 0.3 else 0,
                    )
                    created += 1
        self.stdout.write(f"  Created {created} tasks.")

    def create_study_sessions(self):
        """Seed StudySession and ThemeSession records for named fixture users.

        Each fixture user is assigned a profile ('balanced', 'night_owl', or
        'consistent') that controls session timing and volume across the past
        90 days. Sessions that already exist are skipped to keep the command
        idempotent.
        """
        self.stdout.write("Seeding study sessions and theme sessions...")
        from studyFlax.models.timer.sessionModel import StudySession
        from studyFlax.models.timer.themeSessionModel import ThemeSession

        # map username → (study_profile, theme_profile)
        PROFILES = {
            'janedoe': ('balanced',    'balanced'),
            'charlie': ('night_owl',   'night_owl'),
            'amiller': ('consistent',  'consistent'),
            'srahwan': ('balanced',    'balanced'),
            'hpatel':  ('consistent',  'consistent'),
            'echen':   ('night_owl',   'night_owl'),
            'jmurphy': ('balanced',    'consistent'),
        }

        from django.contrib.auth import get_user_model
        User = get_user_model()

        total_study  = 0
        total_theme  = 0

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
        is_ratified = random.choice([True, False])
        status = 'approved' if is_ratified else 'none'
        defaults = {
            'bio': data['bio'], 'about': data['about'],
            'categories': data.get('categories', []),
            'ratification_status': status, 'is_ratified': is_ratified
        }
        if data.get('image'):
            defaults['image'] = data['image']
        existing = Society.objects.filter(name=data['name']).first()
        if existing:
            for key, value in defaults.items():
                setattr(existing, key, value)
            existing._skip_notification = True
            existing.save()
            return existing
        society = Society(name=data['name'], **defaults)
        society._skip_notification = True
        society.save()
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
        if SocietyEvent.objects.filter(society=society, title=title).exists():
            return
        event = SocietyEvent(society=society, title=title, **self._build_event_defaults(desc, start, end, recurrence, tags))
        event._skip_notification = True
        event.save()

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
        for society in Society.objects.all():
            self._seed_society_members(society)

    def _seed_society_members(self, society):
        admin = random.choice(self.users)
        SocietyMembership.objects.get_or_create(
            user=admin, society=society, defaults={'role': 'admin'}
        )
        society.admin_emails = admin.email
        society.save()
        members = random.sample(self.users, random.randint(5, 15))
        for member in members:
            SocietyMembership.objects.get_or_create(
                user=member, society=society, defaults={'role': 'member'}
            )

    def create_society_events(self):
        self.stdout.write("Seeding society events...")
        for society in Society.objects.all():
            self._seed_events_for_society(society)

    def create_society_images(self):
        self.stdout.write("Seeding society images...")
        for society in Society.objects.all():
            self._seed_images_for_society(society)

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
            ("Users", User.objects.count()), ("Modules", Module.objects.count()),
            ("Societies", Society.objects.count()), ("Events", CalendarEvent.objects.count()),
        ]
        for label, count in stats:
            self.stdout.write(f"  {label:<14}  {count}")
        self.stdout.write(self.style.SUCCESS(div))
