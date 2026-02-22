import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent,
    UserSettings, Module, Enrollment, Deadline
)
from studyFlax.fixtures.data_fixtures import (
    category_fixtures, tag_fixtures, recurrence_fixtures, module_fixtures,
)
from .seed_helpers import (
    build_users_list, build_settings_for_new_users, build_events_for_user,
    build_meal_events, build_module_event, get_user_modules,
    build_lecture_events, create_lecture_event, build_deadlines_for_module, 
    create_deadline_calendar_event,
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with structured data based on fixtures and Faker.'

    USER_COUNT         = 25
    DEFAULT_PASSWORD   = '1234'

    FIXTURE_USERS = [
        {'username': 'johndoe', 'email': 'john.doe@kcl.ac.uk',  'first_name': 'John',    'last_name': 'Doe',   'is_superuser': True,  'is_staff': True},
        {'username': 'janedoe', 'email': 'jane.doe@kcl.ac.uk',  'first_name': 'Jane',    'last_name': 'Doe',   'is_superuser': False, 'is_staff': False},
        {'username': 'charlie', 'email': 'charlie@kcl.ac.uk',   'first_name': 'Charlie', 'last_name': 'Smith', 'is_superuser': False, 'is_staff': False},
        {'username': 'amiller', 'email': 'alan.miller@kcl.ac.uk', 'first_name': 'Alan',  'last_name': 'Miller', 'is_superuser': False, 'is_staff': True, 'role': 'teacher'},
        {'username': 'srahwan', 'email': 's.rahwan@kcl.ac.uk',    'first_name': 'Sarah', 'last_name': 'Rahwan', 'is_superuser': False, 'is_staff': True, 'role': 'teacher'},
        {'username': 'hpatel',  'email': 'h.patel@kcl.ac.uk',     'first_name': 'Himesh', 'last_name': 'Patel',  'is_superuser': False, 'is_staff': True, 'role': 'teacher'},
        {'username': 'echen',   'email': 'elaine.chen@kcl.ac.uk', 'first_name': 'Elaine', 'last_name': 'Chen',   'is_superuser': False, 'is_staff': True, 'role': 'teacher'},
        {'username': 'jmurphy', 'email': 'j.murphy@kcl.ac.uk',    'first_name': 'James',  'last_name': 'Murphy', 'is_superuser': False, 'is_staff': True, 'role': 'teacher'},
    ]

    def _load_shared_data(self):
        self.users      = list(User.objects.filter(is_staff=False))
        self.categories = list(Category.objects.all())
        self.tags       = list(Tag.objects.all())
        self.rules      = list(RecurrenceRule.objects.all())
        self.modules    = list(Module.objects.all())

    def handle(self, *args, **options):
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
        self.print_stats()

    def create_admin_user(self):
        if User.objects.filter(username='johndoe').exists():
            return
        User.objects.create_superuser(
            username='johndoe', email='john.doe@example.com',
            password=self.DEFAULT_PASSWORD, first_name='John', last_name='Doe',
        )
        self.stdout.write(self.style.SUCCESS("Created admin user: johndoe"))

    def create_fixture_users(self):
        self.stdout.write("Seeding fixture users...")
        for data in self.FIXTURE_USERS:
            if User.objects.filter(username=data['username']).exists():
                continue
            user = User(**{k: v for k, v in data.items() if k not in ('is_superuser', 'is_staff')})
            user.is_superuser = data['is_superuser']
            user.is_staff     = data['is_staff']
            user.set_password(self.DEFAULT_PASSWORD)
            user.save()
            self.stdout.write(f"  Created user: {data['username']}")

    def create_random_users(self):
        needed = self.USER_COUNT - User.objects.count()
        if needed <= 0:
            self.stdout.write("Enough users already exist.")
            return
        self.stdout.write(f"Seeding {needed} users...")
        User.objects.bulk_create(build_users_list(needed), ignore_conflicts=True)
        UserSettings.objects.bulk_create(build_settings_for_new_users())

    def create_recurrence_rules(self):
        self.stdout.write("Seeding recurrence rules...")
        for freq, interval in recurrence_fixtures:
            RecurrenceRule.objects.get_or_create(frequency=freq, interval=interval)

    def create_categories(self):
        self.stdout.write("Seeding categories...")
        for name, color, is_default in category_fixtures:
            user = random.choice(self.users) if not is_default and self.users and random.random() > 0.7 else None
            Category.objects.get_or_create(
                name=name, user=user,
                defaults={'color': color, 'is_default': is_default},
            )

    def create_tags(self):
        self.stdout.write("Seeding tags...")
        from faker import Faker
        f = Faker('en_GB')
        for name, duration in tag_fixtures:
            category = random.choice(self.categories) if self.categories and random.random() > 0.3 else None
            user = (
                category.user if category and category.user
                else (random.choice(self.users) if self.users and random.random() > 0.7 else None)
            )
            Tag.objects.get_or_create(
                name=name, user=user,
                defaults={'category': category, 'default_duration': duration, 'color': f.hex_color()},
            )

    def create_events_for_users(self):
        self.stdout.write("Seeding events for users...")
        total = 0
        for i, user in enumerate(self.users):
            print(f"Processing user {i+1}/{len(self.users)}: {user.username}", end='\r')

            personal_events = build_events_for_user(user, self.tags, self.rules, 0)
            CalendarEvent.objects.bulk_create(personal_events)

            meal_events = build_meal_events(user, self.tags)
            CalendarEvent.objects.bulk_create(meal_events)

            total += len(personal_events) + len(meal_events)

        print(f"\nCreated {total} events across {len(self.users)} users.")

    def _create_module(self, code, name, description, admin, weekly_rule):
        if not Module.objects.filter(module_code=code).exists():
            Module.objects.create(**build_module_event(code, name, description, admin, weekly_rule))

    def create_modules(self):
        self.stdout.write("Seeding modules...")
        admin       = User.objects.filter(is_superuser=True).first()
        weekly_rule = RecurrenceRule.objects.filter(frequency='weekly', interval=1).first()
        for code, name, description in module_fixtures:
            self._create_module(code, name, description, admin, weekly_rule)

    def create_deadlines(self):
        self.stdout.write("Seeding deadlines...")
        deadlines_to_create = []
        for module in self.modules:
            deadlines_to_create.extend(build_deadlines_for_module(module))
        Deadline.objects.bulk_create(deadlines_to_create, ignore_conflicts=True)
        self.stdout.write(f"Created {len(deadlines_to_create)} deadlines.")

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
        self.stdout.write("Seeding enrollments and lecture events...")
        lecture_tag = next((t for t in self.tags if t.name == 'Lecture'), None)
        enrollments = []
        for user in User.objects.all().select_related('settings'):
            self._process_user_modules(user, lecture_tag, enrollments)
        Enrollment.objects.bulk_create(enrollments, ignore_conflicts=True)
        self.stdout.write(f"Created {len(enrollments)} enrollments.")

    def print_stats(self):
        stats = [
            ("Users",       User.objects.count()),
            ("Modules",     Module.objects.count()),
            ("Enrollments", Enrollment.objects.count()),
            ("Categories",  Category.objects.count()),
            ("Tags",        Tag.objects.count()),
            ("Events",      CalendarEvent.objects.count()),
            ("Deadlines",   Deadline.objects.count()),
        ]
        self.stdout.write("\n" + self.style.SUCCESS("✅ Seeding complete!"))
        self.stdout.write(self.style.SUCCESS("─" * 35))
        for label, count in stats:
            self.stdout.write(f"  {self.style.SUCCESS('●')} {label:<14} {self.style.WARNING(str(count))}")
        self.stdout.write(self.style.SUCCESS("─" * 35))
        self.stdout.write(f"  {self.style.HTTP_INFO('Fixture users: johndoe (admin), janedoe, charlie')}")
        self.stdout.write(f"  {self.style.HTTP_INFO('Password: 1234')}\n")