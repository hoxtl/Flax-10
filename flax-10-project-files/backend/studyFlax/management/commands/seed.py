"""
Django management command for seeding the database.

Run with::

    python manage.py seed

Creates fixture users, random users, categories, tags, recurrence rules,
calendar events, modules, deadlines, enrolments, study sessions and theme
sessions.  All operations are idempotent — running the command on an
already-seeded database will not produce duplicates.
"""

import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent,
    Module, Enrollment, Deadline, Reading,
    Society,
)
from studyFlax.models.tasks.task_model import Task, TaskList
from studyFlax.models.groupwork.groupwork_model import GroupProject
from studyFlax.models.calendar.event_attendance_model import EventAttendance
from studyFlax.fixtures.data_fixtures import (
    category_fixtures, tag_fixtures, recurrence_fixtures,
    MODULE_PILL_COLORS,
)
from .seed_users import (
    FIXTURE_USERS, ROLE_LABELS,
    create_admin_user, create_fixture_users, create_random_users,
)
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
from .seed_reading_helpers import build_readings_for_module, build_reading_user_history
from .seed_attendance import seed_attendance
from studyFlax.utils.reading_utils import update_reading_estimates

User = get_user_model()


def _seed_user_pool():
    return list(User.objects.filter(role__in=['student', 'teacher']))

def _display_role(username, role):
    return 'admin/student' if username == 'johndoe' else role


class Command(BaseCommand):
    """Seeds the database with a structured, realistic dataset."""

    help = 'Seeds the database with structured data based on fixtures and Faker.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--teacher-count', type=int, default=14,
            help='Target total number of teacher accounts.',
        )

    def handle(self, *args, **options):
        self.teacher_count = options.get('teacher_count', 14) or 14
        self.stdout.write(self.style.SUCCESS('Starting seeding process...'))
        self._seed_users()
        self._seed_catalogue()
        self._load_shared_data()
        self._seed_content()
        self.print_stats()

    def _load_shared_data(self):
        self.users = _seed_user_pool()
        self.categories = list(Category.objects.all())
        self.tags = list(Tag.objects.all())
        self.rules = list(RecurrenceRule.objects.all())
        self.modules = list(Module.objects.all())

    def _seed_users(self):
        create_admin_user(self.stdout)
        create_fixture_users(self.stdout)
        create_random_users(self.stdout, target_teacher_count=self.teacher_count)
        self.users = _seed_user_pool()

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
        self._seed_readings()
        seed_attendance(self.stdout)

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
        self.categories = list(Category.objects.all())

    def _tag_color(self, name):
        from faker import Faker
        if name in ('Routine', 'Wellness', 'Meals'):
            return '#94a3b8'
        return Faker('en_GB').hex_color()

    def _tag_category(self, user=None):
        if not self.categories:
            return None
        eligible = self.categories if user is None else [c for c in self.categories if c.user_id in (None, user.id)]
        if not eligible or random.random() <= 0.3:
            return None
        return random.choice(eligible)

    def _create_single_tag(self, name, duration, user):
        category = self._tag_category(user)
        Tag.objects.get_or_create(
            name=name, user=user,
            defaults={'category': category, 'default_duration': duration, 'color': self._tag_color(name)},
        )

    def _create_tags(self):
        self.stdout.write("Seeding tags...")
        for user in self.users:
            for name, duration in tag_fixtures:
                self._create_single_tag(name, duration, user)
        self._create_module_pill_tags()

    def _create_module_pill_tags(self):
        for code, pill_color in MODULE_PILL_COLORS.items():
            Tag.objects.get_or_create(
                name=code, user=None,
                defaults={'category': None, 'default_duration': 0, 'color': pill_color},
            )

    def _seed_readings(self):
        self.stdout.write("Seeding readings...")
        self._seed_readings_for_modules()
        self._seed_reading_history_janedoe()
        self._seed_reading_history_sample()
        self.stdout.write(f"  {Reading.objects.count()} total readings in database.")

    def _seed_readings_for_modules(self):
        readings = []
        for module in self.modules:
            readings.extend(build_readings_for_module(module))
        Reading.objects.bulk_create(readings, ignore_conflicts=True)
        self.stdout.write(f"  Created {len(readings)} readings across {len(self.modules)} modules.")

    def _reading_list_for(self, user):
        return TaskList.objects.filter(user=user, name="Reading List").first()

    def _seed_reading_history_for(self, user):
        reading_list = self._reading_list_for(user)
        if not reading_list:
            return 0
        module_ids = set(Enrollment.objects.filter(student=user).values_list('module', flat=True))
        modules = [m for m in self.modules if m.id in module_ids]
        tasks = build_reading_user_history(user, modules, reading_list)
        Task.objects.bulk_create(tasks, ignore_conflicts=True)
        if tasks:
            update_reading_estimates(user)
        return len(tasks)

    def _seed_reading_history_janedoe(self):
        try:
            jane = User.objects.get(username='janedoe')
        except User.DoesNotExist:
            return
        count = self._seed_reading_history_for(jane)
        self.stdout.write(f"  janedoe: {count} completed reading tasks and speed is personalised")

    def _seed_reading_history_sample(self):
        students = list(User.objects.filter(role='student').exclude(username__in=['janedoe', 'charlie']))
        sample = random.sample(students, min(3, len(students)))
        count = sum(1 for s in sample if self._seed_reading_history_for(s) > 0)
        self.stdout.write(f"  {count} random students seeded with reading history.")

    def _build_stats(self):
        return [
            ("Users",       User.objects.count()),
            ("Modules",     Module.objects.count()),
            ("Enrolments",  Enrollment.objects.count()),
            ("Deadlines",   Deadline.objects.count()),
            ("Tasks",       Task.objects.count()),
            ("Group Projects", GroupProject.objects.count()),
            ("Categories",  Category.objects.count()),
            ("Tags",        Tag.objects.count()),
            ("Events",      CalendarEvent.objects.count()),
            ("Societies",   Society.objects.count()),
            ("Readings",    Reading.objects.count()),
            ("Attendance",  EventAttendance.objects.count()),
        ]

    def _ordered_fixture_users(self):
        role_order = {'admin': 0, 'student': 1, 'teacher': 2}
        entries = ((item['username'], ROLE_LABELS.get(item['username'], 'student')) for item in FIXTURE_USERS)
        sorted_entries = sorted(entries, key=lambda pair: (role_order.get(pair[1], 1), pair[0]))
        return [(u, _display_role(u, r)) for u, r in sorted_entries]

    def _print_fixture_users(self):
        self.stdout.write("  Fixture users (password: 1234)")
        for username, role in self._ordered_fixture_users():
            self.stdout.write(f"  {username:<12}  {role}")

    def _print_database_stats(self):
        self.stdout.write("  Database")
        for label, count in self._build_stats():
            self.stdout.write(f"  {label:<14}  {count}")

    def print_stats(self):
        """Print a summary of all seeded data."""
        div = "\u2500" * 40
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write(self.style.SUCCESS("  Seeding complete"))
        self.stdout.write(self.style.SUCCESS(div))
        self._print_fixture_users()
        self._print_database_stats()
        self.stdout.write(self.style.SUCCESS(div))
