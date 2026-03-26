"""
Seeds development data for the StudyFlax backend.
"""

import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent,
    Module, Enrollment, Deadline, Reading, UserSettings,
    Society, CalendarShare,
)
from studyFlax.models.notifications.notification_model import Notification
from studyFlax.models.tasks.task_model import Task
from studyFlax.models.groupwork.groupwork_model import GroupProject
from studyFlax.models.calendar.event_attendance_model import EventAttendance
from studyFlax.fixtures.planning.data_fixtures import MODULE_PILL_COLORS
from studyFlax.fixtures.users.user_fixtures import category_fixtures, recurrence_fixtures, tag_fixtures
from .seed_support.users.users import (
    FIXTURE_USERS, ROLE_LABELS,
    create_admin_user, create_fixture_users, create_random_users,
)
from .seed_support.users.calendar_shares import (
    build_calendar_share_pairs,
    create_calendar_shares,
    seed_shares_with_fixtures,
)
from .seed_support.events.events import create_events_for_users
from .seed_support.content.modules import create_modules, create_deadlines, create_enrollments
from .seed_support.content.tasks import create_tasks, create_society_tasks
from .seed_support.groups.groups import (
    create_group_projects, create_group_memberships, create_group_tasks, seed_group_availability,
)
from .seed_support.sessions.sessions import create_study_sessions
from .seed_support.content.societies import (
    create_societies, create_society_memberships,
    create_society_events, create_society_images,
)
from .seed_support.readings.readings import create_readings
from .seed_support.events.attendance import seed_attendance
from .seed_support.users.admin import seed_course_change_requests, seed_society_reports
from .seed_support.core.usersettings import ensure_usersettings_seed_compatibility

User = get_user_model()
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
        """Register the optional teacher-count override for seed runs."""

        parser.add_argument(
            '--teacher-count', type=int, default=14,
            help='Target total number of teacher accounts.',
        )

    def handle(self, *args, **options):
        """Seed the backend with the full development dataset."""

        if _is_already_seeded():
            self._print_already_seeded_warning()
            return
        self.teacher_count = options.get('teacher_count', 14) or 14
        div = "\u2500" * 40
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write(self.style.SUCCESS("  Seeding database"))
        self.stdout.write(self.style.SUCCESS(div))
        self._ensure_usersettings_seed_compatibility()
        self.stdout.write("")
        self.stdout.write("  Users")
        self._seed_users()
        self.stdout.write("")
        self.stdout.write("  Catalogue")
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
        ensure_usersettings_seed_compatibility(UserSettings._meta.db_table)

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

    def _print_module_counts(self):
        self.stdout.write(
            f"  \u2713  {'Modules':<14} {Module.objects.count():,}"
            f"  \u00b7  Deadlines {Deadline.objects.count():,}"
            f"  \u00b7  Enrolments {Enrollment.objects.count():,}"
        )

    def _seed_events_and_modules(self):
        create_events_for_users(self.users, self.tags, self.rules, self.stdout)
        create_modules(self.stdout)
        self.modules = list(Module.objects.all())
        create_deadlines(self.modules, self.stdout)
        create_enrollments(self.modules, self.tags, self.stdout)
        self._print_module_counts()

    def _seed_tasks_sessions_and_readings(self):
        create_tasks(self.users, self.stdout)
        create_study_sessions(self.stdout)
        students = list(User.objects.filter(role='student'))
        create_readings(self.modules, students, self.stdout)
        seed_attendance(self.stdout)

    def _seed_content_sections(self):
        self._seed_events_and_modules()
        self._seed_tasks_sessions_and_readings()

    def _seed_content(self):
        self.stdout.write("")
        self.stdout.write("  Events & Content")
        self._seed_content_sections()
        self.stdout.write("")
        self.stdout.write("  Societies & Groups")
        self._seed_societies_and_groups()
        self._seed_calendar_shares()
        self.stdout.write("")
        self.stdout.write("  Admin")
        self._seed_admin_data()

    def _seed_admin_data(self):
        seed_course_change_requests(self.stdout)
        seed_society_reports(self.stdout)

    def _seed_societies_and_groups(self):
        create_societies(self.stdout)
        create_society_memberships(self.stdout)
        create_society_events(self.stdout)
        create_society_images(self.stdout)
        create_society_tasks(self.stdout)
        self.stdout.write(f"  \u2713  {'Societies':<14} {Society.objects.count():,}")
        create_group_projects(self.stdout)
        create_group_memberships(self.stdout)
        create_group_tasks(self.stdout)
        seed_group_availability(self.stdout)
        Notification.objects.filter(title="Added to Group Project").delete()
        self.stdout.write(f"  \u2713  {'Group projects':<14} {GroupProject.objects.count():,}")

    def _seed_calendar_shares(self):
        fixture_names = {"janedoe", "charlie", "johndoe"}
        users = sorted(User.objects.filter(role__in=["student", "teacher"]), key=lambda u: u.username)
        if len(users) < 2:
            return
        non_fixture = [u for u in users if u.username not in fixture_names]
        planned_pairs = build_calendar_share_pairs(non_fixture)
        create_calendar_shares(non_fixture, planned_pairs)
        seed_shares_with_fixtures(users, fixture_names)
        self.stdout.write(f"  \u2713  {'Shares':<14} {CalendarShare.objects.count():,}")

    def _create_recurrence_rules(self):
        for freq, interval in recurrence_fixtures:
            RecurrenceRule.objects.get_or_create(frequency=freq, interval=interval)
        self.stdout.write(f"  \u2713  {'Recurrence rules':<16} {RecurrenceRule.objects.count():,}")

    def _create_categories(self):
        for name, color, is_default in category_fixtures:
            user = random.choice(self.users) if not is_default and self.users and random.random() > 0.7 else None
            Category.objects.get_or_create(
                name=name, user=user,
                defaults={'color': color, 'is_default': is_default},
            )
        self.categories = list(Category.objects.all())
        self.stdout.write(f"  \u2713  {'Categories':<16} {len(self.categories):,}")

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
        for user, (name, duration) in itertools.product(self.users, tag_fixtures):
            self._create_single_tag(name, duration, user)
        self._create_module_pill_tags()
        self.stdout.write(f"  \u2713  {'Tags':<16} {Tag.objects.count():,}")

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
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write(self.style.SUCCESS("  Seeding complete"))
        self.stdout.write(self.style.SUCCESS(div))
        self._print_fixture_users()
        self._print_database_stats()
        self.stdout.write(self.style.SUCCESS(div))
