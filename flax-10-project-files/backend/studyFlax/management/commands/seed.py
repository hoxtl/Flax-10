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

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent,
    Module, Enrollment, Deadline, Reading,
    Society,
)
from studyFlax.models.tasks.taskModel import Task, TaskList
from studyFlax.models.groupwork.groupwork_models import GroupProject
from studyFlax.fixtures.data_fixtures import (
    category_fixtures, tag_fixtures, recurrence_fixtures,
    MODULE_PILL_COLORS,
)
from .seed_helpers import build_readings_for_module, build_reading_user_history_
from studyFlax.utils.reading_utils import update_reading_estimates
from .seed_users import create_admin_user, create_fixture_users, create_random_users
from .seed_events import create_events_for_users
from .seed_modules import create_modules, create_deadlines, create_enrollments
from .seed_tasks import create_tasks
from .seed_groups import (
    create_group_projects, create_group_memberships, create_group_tasks,
)
from .seed_sessions import create_study_sessions
from .seed_societies import (
    create_societies, create_society_memberships,
    create_society_events, create_society_images,
)

User = get_user_model()


class Command(BaseCommand):
    """Seeds the database with a structured, realistic dataset.

    Orchestrates the full seeding pipeline: users → categories/tags →
    events → modules → deadlines → enrollments → study sessions.
    All steps are idempotent.
    """

    help = 'Seeds the database with structured data based on fixtures and Faker.'

    def _load_shared_data(self):
        self.users = list(User.objects.filter(is_staff=False))
        self.categories = list(Category.objects.all())
        self.tags = list(Tag.objects.all())
        self.rules = list(RecurrenceRule.objects.all())
        self.modules = list(Module.objects.all())

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting seeding process...'))
        self._seed_users()
        self._seed_catalogue()
        self._load_shared_data()
        self._seed_content()
        self.print_stats()

    def _seed_users(self):
        create_admin_user(self.stdout)
        create_fixture_users(self.stdout)
        create_random_users(self.stdout)
        self.users = list(User.objects.filter(is_staff=False))

    def _seed_catalogue(self):
        self._create_recurrence_rules()
        self._create_categories()
        self._create_tags()

    def _seed_content(self):
        create_events_for_users(self.users, self.tags, self.rules, self.stdout)
        create_modules(self.stdout)
        self.modules = list(Module.objects.all())
        create_deadlines(self.modules, self.stdout)
        create_enrollments(self.modules, self.tags, self.stdout)
        create_tasks(self.users, self.stdout)
        self._seed_societies_and_groups()
        create_study_sessions(self.stdout)
        self._create_readings()

    def _seed_societies_and_groups(self):
        create_societies(self.stdout)
        create_society_memberships(self.stdout)
        create_society_events(self.stdout)
        create_society_images(self.stdout)
        create_group_projects(self.stdout)
        create_group_memberships(self.stdout)
        create_group_tasks(self.stdout)

    def _create_recurrence_rules(self):
        self.stdout.write("Seeding recurrence rules...")
        for freq, interval in recurrence_fixtures:
            RecurrenceRule.objects.get_or_create(frequency=freq, interval=interval)

    def _create_categories(self):
        self.stdout.write("Seeding categories...")
        for name, color, is_default in category_fixtures:
            user = random.choice(self.users) if not is_default and self.users and random.random() > 0.7 else None
            Category.objects.get_or_create(
                name=name, user=user,
                defaults={'color': color, 'is_default': is_default},
            )

    def _resolve_tag_user(self, category):
        if category and category.user:
            return category.user
        if self.users and random.random() > 0.7:
            return random.choice(self.users)
        return None

    def _create_tags(self):
        self.stdout.write("Seeding tags...")
        from faker import Faker
        f = Faker('en_GB')
        routine_color = '#94a3b8'
        wellness_color = '#94a3b8'
        for name, duration in tag_fixtures:
            category = random.choice(self.categories) if self.categories and random.random() > 0.3 else None
            user = self._resolve_tag_user(category)
            color = routine_color if name == 'Routine' else (wellness_color if name == 'Wellness' else f.hex_color())
            Tag.objects.get_or_create(
                name=name, user=user,
                defaults={'category': category, 'default_duration': duration, 'color': color},
            )
        self._create_module_pill_tags()

    def _create_module_pill_tags(self):
        for code, pill_color in MODULE_PILL_COLORS.items():
            Tag.objects.get_or_create(
                name=code, user=None,
                defaults={'category': None, 'default_duration': 0, 'color': pill_color},
            )

    def _create_readings(self):
        self.stdout.write("Seeding readings..")
        self._seed_readings_for_modules()
        self._seed_reading_history_janedoe()
        self._seed_reading_history_random_students()
        self.stdout.write(f" {Reading.objects.count()} total readings in database.")

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

    def _build_stats(self):
        return [
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
            ("Readings",    Reading.objects.count()),
        ]

    def print_stats(self):
        div = "\u2500" * 40
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write(self.style.SUCCESS("  Seeding complete"))
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write("  Fixture users (password: 1234)")
        for user, role in [('johndoe', 'admin'), ('janedoe', 'student'), ('charlie', 'student')]:
            self.stdout.write(f"  {user:<12}  {role}")
        self.stdout.write("  Database")
        for label, count in self._build_stats():
            self.stdout.write(f"  {label:<14}  {count}")
        self.stdout.write(self.style.SUCCESS(div))
