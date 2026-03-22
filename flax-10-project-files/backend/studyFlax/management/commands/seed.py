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
from studyFlax.models.auth.course_change_request_model import CourseChangeRequest
from studyFlax.models.society.society_report_model import SocietyReport
from studyFlax.models.notifications.notification_model import Notification
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
    create_group_projects, create_group_memberships, create_group_tasks, seed_group_availability,
)
from .seed_sessions import create_study_sessions
from .seed_societies import (
    create_societies, create_society_memberships,
    create_society_events, create_society_images,
)
from .seed_readings import create_readings
from .seed_attendance import seed_attendance
from .seed_admin import seed_teacher_requests, seed_course_change_requests, seed_society_reports

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


def _apply_legacy_column_fix(table_name):
    """Apply default and null fix for legacy widget sizes column."""
    alter_sql = f'ALTER TABLE "{table_name}" ALTER COLUMN "{LEGACY_WIDGET_SIZES_COLUMN}" SET DEFAULT \'{{}}\'::jsonb;'
    update_sql = f'UPDATE "{table_name}" SET "{LEGACY_WIDGET_SIZES_COLUMN}" = \'{{}}\'::jsonb WHERE "{LEGACY_WIDGET_SIZES_COLUMN}" IS NULL;'
    with connection.cursor() as cursor:
        cursor.execute(alter_sql)
        cursor.execute(update_sql)


def _display_role(username, role):
    return 'admin/student' if username == 'johndoe' else role


def _is_already_seeded():
    """Check if fixture users exist to detect prior seeding."""
    fixture_usernames = {'johndoe', 'janedoe', 'charlie', 'amiller'}
    existing = set(User.objects.filter(username__in=fixture_usernames).values_list('username', flat=True))
    return len(existing) >= 2


def _initial_share_pairs(users, rng):
    """Build initial round-robin share pairs."""
    shuffled = users[:]
    rng.shuffle(shuffled)
    return {(owner.id, shuffled[(i + 1) % len(shuffled)].id) for i, owner in enumerate(shuffled)}


def _find_new_pairs(owner_id, candidates, planned_pairs, limit):
    """Find new pairs that aren't already planned."""
    new_pairs = [(owner_id, t.id) for t in candidates if (owner_id, t.id) not in planned_pairs]
    return new_pairs[:limit]


def _add_extra_pairs_for_owner(owner, users, rng, planned_pairs):
    """Add extra random share pairs for one owner."""
    candidates = [t for t in users if t.id != owner.id]
    rng.shuffle(candidates)
    target_count = rng.randint(0, min(3, len(candidates) - 1))
    new_pairs = _find_new_pairs(owner.id, candidates, planned_pairs, target_count)
    planned_pairs.update(new_pairs)


def _build_calendar_share_pairs(users):
    """Build all calendar share pairs for users."""
    rng = random.Random("studyflax-calendar-shares")
    planned_pairs = _initial_share_pairs(users, rng)
    for owner in users:
        _add_extra_pairs_for_owner(owner, users, rng, planned_pairs)
    return planned_pairs


def _create_share_if_valid(owner, target):
    """Create share between users if both exist. Returns 1 if created, 0 otherwise."""
    if not (owner and target):
        return 0
    _, was_created = CalendarShare.objects.get_or_create(owner=owner, shared_with=target)
    return int(was_created)


def _create_calendar_shares(users, planned_pairs):
    """Create CalendarShare objects from pairs."""
    user_by_id = {u.id: u for u in users}
    pairs_with_users = [(user_by_id.get(oid), user_by_id.get(tid)) for oid, tid in sorted(planned_pairs)]
    return sum(_create_share_if_valid(owner, target) for owner, target in pairs_with_users)


def _seed_inbound_for_fixture(target, all_users):
    rng = random.Random(f"studyflax-{target.username}-shares-v2")
    potential = [u for u in all_users if u.username != target.username]
    shuffled = potential[:]
    rng.shuffle(shuffled)
    non_sharers = {u.username for u in shuffled[:5]}
    sharers = [u for u in potential if u.username not in non_sharers]
    for sharer in sharers:
        CalendarShare.objects.get_or_create(owner=sharer, shared_with=target)


def _seed_outbound_for_fixture(owner, all_users):
    rng = random.Random(f"studyflax-{owner.username}-outbound-v1")
    potential = [u for u in all_users if u.username != owner.username]
    shuffled = potential[:]
    rng.shuffle(shuffled)
    for viewer in shuffled[:len(shuffled) // 2]:
        CalendarShare.objects.get_or_create(owner=owner, shared_with=viewer)


def _seed_viewer_shares_for_user(user, all_users):
    rng = random.Random(f"studyflax-{user.username}-viewers-v1")
    pool = [u for u in all_users if u.username != user.username]
    rng.shuffle(pool)
    for viewer in pool[:5]:
        CalendarShare.objects.get_or_create(owner=user, shared_with=viewer)


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
        div = "\u2500" * 40
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write(self.style.SUCCESS("  Seeding database"))
        self.stdout.write(self.style.SUCCESS(div))
        self._ensure_usersettings_seed_compatibility()
        self._seed_users()
        self.stdout.write("")
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
        _apply_legacy_column_fix(table_name)

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
        self.stdout.write(
            f"  \u2713  {'Modules':<14} {Module.objects.count():,}"
            f"  \u00b7  Deadlines {Deadline.objects.count():,}"
            f"  \u00b7  Enrolments {Enrollment.objects.count():,}"
        )
        create_tasks(self.users, self.stdout)
        self._seed_societies_and_groups()
        self._seed_calendar_shares()
        create_study_sessions(self.stdout)
        students = list(User.objects.filter(role='student'))
        create_readings(self.modules, students, self.stdout)
        seed_attendance(self.stdout)
        self._seed_admin_data()

    def _seed_admin_data(self):
        seed_teacher_requests(self.stdout)
        seed_course_change_requests(self.stdout)
        seed_society_reports(self.stdout)

    def _seed_societies_and_groups(self):
        create_societies(self.stdout)
        create_society_memberships(self.stdout)
        create_society_events(self.stdout)
        create_society_images(self.stdout)
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
        planned_pairs = _build_calendar_share_pairs(non_fixture)
        _create_calendar_shares(non_fixture, planned_pairs)
        self._seed_shares_with_fixtures(users, fixture_names)
        self.stdout.write(f"  \u2713  {'Shares':<14} {CalendarShare.objects.count():,}")

    def _seed_shares_with_fixtures(self, all_users, fixture_names):
        """Everyone except 5 random users shares their calendar with each fixture user.
        Also, each fixture user shares their calendar with ~half the other users.
        And every non-fixture user gets ~5 random viewers of their calendar."""
        fixture_users = {u.username: u for u in all_users if u.username in fixture_names}
        non_fixture = [u for u in all_users if u.username not in fixture_names]
        for target in fixture_users.values():
            _seed_inbound_for_fixture(target, all_users)
        for owner in fixture_users.values():
            _seed_outbound_for_fixture(owner, all_users)
        for user in non_fixture:
            _seed_viewer_shares_for_user(user, all_users)

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
