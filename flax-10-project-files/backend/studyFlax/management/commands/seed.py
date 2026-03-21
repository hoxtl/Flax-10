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
from django.db import connection

from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent,
    Module, Enrollment, Deadline, Reading, UserSettings,
    Society, CalendarShare,
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
from .seed_readings import create_readings
from .seed_attendance import seed_attendance

User = get_user_model()
LEGACY_WIDGET_SIZES_COLUMN = "homepage_widget_sizes"
SOFT_TAG_COLORS = {
    "Lecture": "#C98C56",
    "Deadline": "#7F5B63",
    "Exam": "#6B78B8",
    "Schedule": "#CBBE74",
    "Meals": "#8FA1BC",
    "Other": "#8D837A",
    "Routine": "#A5B1A2",
    "Wellness": "#8EB6A8",
}
SOFT_FALLBACK_TAG_COLORS = (
    "#B58F78",
    "#8FA1BC",
    "#A59ABF",
    "#AEB88A",
    "#C39A86",
    "#8FB6B0",
)


def _seed_user_pool():
    return list(User.objects.filter(role__in=['student', 'teacher']))


def _table_columns(table_name):
    with connection.cursor() as cursor:
        return {column.name for column in connection.introspection.get_table_description(cursor, table_name)}


def _display_role(username, role):
    return 'admin/student' if username == 'johndoe' else role


def _is_already_seeded():
    """Check if fixture users exist to detect prior seeding."""
    fixture_usernames = {'johndoe', 'janedoe', 'charlie', 'amiller'}
    existing = set(User.objects.filter(username__in=fixture_usernames).values_list('username', flat=True))
    return len(existing) >= 2


class Command(BaseCommand):
    """Seeds the database with a structured, realistic dataset."""

    help = 'Seeds the database with structured data based on fixtures and Faker.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--teacher-count', type=int, default=14,
            help='Target total number of teacher accounts.',
        )

    def handle(self, *args, **options):
        if _is_already_seeded():
            self._print_already_seeded_warning()
            return
        self.teacher_count = options.get('teacher_count', 14) or 14
        self.stdout.write(self.style.SUCCESS('Starting seeding process...'))
        self._ensure_usersettings_seed_compatibility()
        self._seed_users()
        self._seed_catalogue()
        self._load_shared_data()
        self._seed_content()
        self.print_stats()

    def _print_already_seeded_warning(self):
        div = "\u2500" * 40
        self.stdout.write("")
        self.stdout.write(self.style.WARNING(div))
        self.stdout.write(self.style.WARNING("  Database already seeded"))
        self.stdout.write(self.style.WARNING(div))
        self.stdout.write("")
        self.stdout.write("  Fixture users detected. To reseed, first run:")
        self.stdout.write(self.style.SUCCESS("    python manage.py unseed"))
        self.stdout.write("")

    def _ensure_usersettings_seed_compatibility(self):
        table_name = UserSettings._meta.db_table
        if LEGACY_WIDGET_SIZES_COLUMN not in _table_columns(table_name):
            return
        self.stdout.write(
            f"Detected legacy {LEGACY_WIDGET_SIZES_COLUMN} column; enabling seed compatibility..."
        )
        with connection.cursor() as cursor:
            cursor.execute(
                f'ALTER TABLE "{table_name}" '
                f'ALTER COLUMN "{LEGACY_WIDGET_SIZES_COLUMN}" SET DEFAULT \'{{}}\'::jsonb;'
            )
            cursor.execute(
                f'UPDATE "{table_name}" '
                f'SET "{LEGACY_WIDGET_SIZES_COLUMN}" = \'{{}}\'::jsonb '
                f'WHERE "{LEGACY_WIDGET_SIZES_COLUMN}" IS NULL;'
            )

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
        self._seed_calendar_shares()
        create_study_sessions(self.stdout)
        students = list(User.objects.filter(role='student'))
        create_readings(self.modules, students, self.stdout)
        seed_attendance(self.stdout)

    def _seed_societies_and_groups(self):
        create_societies(self.stdout)
        create_society_memberships(self.stdout)
        create_society_events(self.stdout)
        create_society_images(self.stdout)
        create_group_projects(self.stdout)
        create_group_memberships(self.stdout)
        create_group_tasks(self.stdout)

    def _seed_calendar_shares(self):
        self.stdout.write("Seeding calendar shares...")
        users = sorted(
            User.objects.filter(role__in=["student", "teacher"]).exclude(username="johndoe"),
            key=lambda user: user.username,
        )
        rng = random.Random("studyflax-calendar-shares")
        if len(users) < 2:
            self.stdout.write("  Skipped calendar shares: need at least two non-admin users.")
            return
        user_by_id = {user.id: user for user in users}
        shuffled = users[:]
        rng.shuffle(shuffled)
        planned_pairs = {
            (owner.id, shuffled[(index + 1) % len(shuffled)].id)
            for index, owner in enumerate(shuffled)
        }
        for owner in users:
            candidates = [target for target in users if target.id != owner.id]
            rng.shuffle(candidates)
            extra_share_target = rng.randint(0, min(3, len(candidates) - 1))
            extra_created = 0
            for target in candidates:
                pair = (owner.id, target.id)
                if pair in planned_pairs:
                    continue
                planned_pairs.add(pair)
                extra_created += 1
                if extra_created >= extra_share_target:
                    break
        created = 0
        for owner_id, target_id in sorted(planned_pairs):
            owner = user_by_id.get(owner_id)
            target = user_by_id.get(target_id)
            if not owner or not target:
                continue
            _, was_created = CalendarShare.objects.get_or_create(owner=owner, shared_with=target)
            created += int(was_created)
        share_counts = {
            user.username: sum(1 for owner_id, _ in planned_pairs if owner_id == user.id)
            for user in users
        }
        self.stdout.write(
            f"  {CalendarShare.objects.count()} total shares ({created} new this run, "
            f"{min(share_counts.values())}-{max(share_counts.values())} per user)."
        )

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
        if name in SOFT_TAG_COLORS:
            return SOFT_TAG_COLORS[name]
        return SOFT_FALLBACK_TAG_COLORS[sum(ord(char) for char in name) % len(SOFT_FALLBACK_TAG_COLORS)]

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
        import itertools
        self.stdout.write("Seeding tags...")
        for user, (name, duration) in itertools.product(self.users, tag_fixtures):
            self._create_single_tag(name, duration, user)
        self._create_module_pill_tags()

    def _create_module_pill_tags(self):
        for code, pill_color in MODULE_PILL_COLORS.items():
            Tag.objects.get_or_create(
                name=code, user=None,
                defaults={'category': None, 'default_duration': 0, 'color': pill_color},
            )

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
            self.stdout.write(f"  {label:<16}{count:,}")

    def print_stats(self):
        """Print a summary of all seeded data."""
        div = "\u2500" * 40
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write(self.style.SUCCESS("  Seeding complete"))
        self.stdout.write(self.style.SUCCESS(div))
        self._print_fixture_users()
        self._print_database_stats()
        self.stdout.write(self.style.SUCCESS(div))
