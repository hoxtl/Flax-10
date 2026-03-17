"""
Django management command for seeding the database.

Run with::

    python manage.py seed

Creates fixture users, random users, categories, tags, recurrence rules,
calendar events, modules, deadlines, enrollments, study sessions and theme
sessions. All operations are idempotent - running the command on an already-
seeded database will not produce duplicates.
"""

import hashlib
import random
from datetime import datetime, timedelta, timezone as dt_timezone

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent,
    Module, Enrollment, Deadline, Reading,
    Society,
)
from studyFlax.models.tasks.taskModel import Task, TaskList
from studyFlax.models.groupwork.groupworkModel import GroupProject
from studyFlax.models.calendar.eventAttendanceModel import EventAttendance
from studyFlax.fixtures.data_fixtures import (
    category_fixtures, tag_fixtures, recurrence_fixtures,
    MODULE_PILL_COLORS, lecture_theatre_fixtures,
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

# ── Attendance seeding constants ────────────────────────────────────────────
_ATT_SEED_START = datetime(2026, 1, 15, tzinfo=dt_timezone.utc)
_ATT_READING_WEEK = (
    datetime(2026, 2, 23, tzinfo=dt_timezone.utc),
    datetime(2026, 2, 27, tzinfo=dt_timezone.utc),
)
_SESSION_TEMPLATES = [
    ("Lecture",       "Lecture: {module}",   "Weekly lecture session.",       2, "lgt"),
    ("Lecture",       "LGT: {module}",       "Large group teaching session.", 1, "lgt2"),
    ("Small group",   "SmG: {module}",       "Small group tutorial session.", 1, "smg"),
    ("Small group",   "Seminar: {module}",   "Interactive seminar session.",  1, "sem"),
    ("Practical/lab", "Practical: {module}", "Lab practical session.",        3, "prac"),
    ("Practical/lab", "Lab: {module}",       "Scheduled laboratory session.", 2, "lab"),
    ("Other",         "Briefing: {module}",  "Module briefing and Q&A.",      1, "brief"),
    ("Other",         "Workshop: {module}",  "Applied workshop session.",     2, "ws"),
]
_ATT_USER_PROFILES = {
    "johndoe": {"attend_rate": 0.90, "type_bias": {"Practical/lab": 0.98, "Lecture": 0.88}},
    "janedoe": {"attend_rate": 0.95, "type_bias": {"Lecture": 0.98, "Small group": 0.92}},
    "charlie": {"attend_rate": 0.82, "type_bias": {"Lecture": 0.75, "Other": 0.90}},
    "riley":   {"attend_rate": 0.88, "type_bias": {"Small group": 0.95, "Lecture": 0.85}},
    "nina":    {"attend_rate": 0.93, "type_bias": {}},
    "omar":    {"attend_rate": 0.78, "type_bias": {"Practical/lab": 0.95, "Lecture": 0.70}},
    "sofia":   {"attend_rate": 0.91, "type_bias": {"Small group": 0.97, "Other": 0.85}},
    "liamk":   {"attend_rate": 0.85, "type_bias": {"Lecture": 0.80, "Practical/lab": 0.95}},
}
_ATT_RANDOM_PROFILES = [
    {"attend_rate": 0.95, "type_bias": {}},
    {"attend_rate": 0.88, "type_bias": {"Lecture": 0.85}},
    {"attend_rate": 0.75, "type_bias": {"Practical/lab": 0.95, "Lecture": 0.68}},
    {"attend_rate": 0.82, "type_bias": {"Small group": 0.92}},
    {"attend_rate": 0.70, "type_bias": {}},
    {"attend_rate": 0.98, "type_bias": {}},
    {"attend_rate": 0.60, "type_bias": {"Practical/lab": 0.90}},
]


def _stable_hash(s):
    return int(hashlib.md5(s.encode()).hexdigest(), 16)


def _det_choice(items, seed_str):
    return items[_stable_hash(seed_str) % len(items)]


def _att_week_sessions(module_code, week_start):
    week_key = week_start.strftime("%Y%m%d")
    n = (_stable_hash(f"{module_code}{week_key}") % 3) + 2
    indices = sorted(set(
        _stable_hash(f"{module_code}{week_key}{i}") % len(_SESSION_TEMPLATES)
        for i in range(n * 3)
    ))[:n]
    sessions, used_days = [], set()
    for i in indices:
        type_label, title_tmpl, desc, dur_h, src_key = _SESSION_TEMPLATES[i % len(_SESSION_TEMPLATES)]
        day_seed = f"{module_code}{week_key}{src_key}"
        day = _stable_hash(day_seed) % 5
        while day in used_days:
            day = (day + 1) % 5
        used_days.add(day)
        hour = _det_choice([9, 10, 11, 14, 15, 16], f"{day_seed}{day}")
        start = (week_start + timedelta(days=day)).replace(hour=hour, minute=0, second=0, microsecond=0)
        sessions.append({
            "title": title_tmpl.format(module=module_code),
            "description": desc,
            "start": start,
            "end": start + timedelta(hours=dur_h),
            "type_label": type_label,
            "source": "timetable",
            "external_id": f"{src_key}-{module_code}-{start.strftime('%Y%m%dT%H%M')}",
            "location": _det_choice(lecture_theatre_fixtures, f"{module_code}{src_key}"),
        })
    return sessions
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.timer.themeSessionModel import ThemeSession
from studyFlax.utils.reading_utils import update_reading_estimates
from .seed_users import (
    FIXTURE_USERS,
    ROLE_LABELS,
    create_admin_user,
    create_fixture_users,
    create_random_users,
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

User = get_user_model()


def _seed_user_pool():
    return list(User.objects.filter(role__in=['student', 'teacher']))


def _display_role(username, role):
    if username == 'johndoe':
        return 'admin/student'
    return role

class Command(BaseCommand):
    """Seeds the database with a structured, realistic dataset."""

    help = 'Seeds the database with structured data based on fixtures and Faker.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--teacher-count',
            type=int,
            default=14,
            help='Target total number of teacher accounts.',
        )

    def _load_shared_data(self):
        self.users = _seed_user_pool()
        self.categories = list(Category.objects.all())
        self.tags = list(Tag.objects.all())
        self.rules = list(RecurrenceRule.objects.all())
        self.modules = list(Module.objects.all())

    def handle(self, *args, **options):
        self.teacher_count = options.get('teacher_count', 14) or 14
        self.stdout.write(self.style.SUCCESS('Starting seeding process...'))
        self._seed_users()
        self._seed_catalogue()
        self._load_shared_data()
        self._seed_content()
        self.print_stats()

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
        self.categories = list(Category.objects.all())

    def _resolve_tag_user(self, category):
        if category and category.user:
            return category.user
        if self.users and random.random() > 0.7:
            return random.choice(self.users)
        return None

    def _tag_faker(self):
        from faker import Faker
        return Faker('en_GB')

    def _ensure_categories_loaded(self):
        if not hasattr(self, 'categories'):
            self.categories = list(Category.objects.all())

    def _tag_color(self, name, faker_obj):
        if name == 'Routine':
            return '#94a3b8'
        if name == 'Wellness':
            return '#94a3b8'
        return faker_obj.hex_color()

    def _tag_category(self):
        if not self.categories or random.random() <= 0.3:
            return None
        return random.choice(self.categories)

    def _create_tag(self, name, duration, faker_obj):
        category = self._tag_category()
        user = self._resolve_tag_user(category)
        color = self._tag_color(name, faker_obj)
        Tag.objects.get_or_create(
            name=name, user=user,
            defaults={'category': category, 'default_duration': duration, 'color': color},
        )

    def _create_tags(self):
        self.stdout.write("Seeding tags...")
        self._ensure_categories_loaded()
        faker_obj = self._tag_faker()
        for name, duration in tag_fixtures:
            self._create_tag(name, duration, faker_obj)
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
        self.stdout.write( f" {Reading.objects.count()} total readings in database.")
        self.stdout.write("Seeding attendance records..")
        self._seed_attendance()

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

    def _seed_attendance(self):
<<<<<<< Updated upstream
        _EA = EventAttendance
        now = timezone.now()
        students = list(User.objects.filter(role='student'))
=======
        from studyFlax.models import EventAttendance
        now = timezone.now()
        students = list(User.objects.filter(role='student'))
        events_created = attendance_created = 0
>>>>>>> Stashed changes
        weeks_back = int((now - _ATT_SEED_START).days / 7)

        # Build all session data up-front (no DB queries yet)
        all_session_data = []  # (user, profile, session_dict)
        for user in students:
            profile = _ATT_USER_PROFILES.get(user.username, random.choice(_ATT_RANDOM_PROFILES))
            modules = [e.module for e in Enrollment.objects.filter(student=user).select_related('module')]
<<<<<<< Updated upstream
=======
            if not modules:
                continue

            # Build all candidate sessions for this user upfront
            candidates = []
>>>>>>> Stashed changes
            for module in modules:
                for week_offset in range(weeks_back + 1):
                    week_start = _ATT_SEED_START + timedelta(weeks=week_offset)
                    if _ATT_READING_WEEK[0] <= week_start <= _ATT_READING_WEEK[1]:
                        continue
                    for s in _att_week_sessions(module.module_code, week_start):
<<<<<<< Updated upstream
                        if s['start'] >= now:
                            continue
                        all_session_data.append((user, profile, s))

        # Bulk-create missing CalendarEvents
        existing_keys = set(
            CalendarEvent.objects.filter(source='timetable').values_list('user_id', 'external_id')
        )
        new_events = [
            CalendarEvent(
                user=user, source=s['source'], external_id=s['external_id'],
                title=s['title'], description=s['description'],
                start_time=s['start'], end_time=s['end'],
                location=s['location'], priority='high',
            )
            for user, _profile, s in all_session_data
            if (user.pk, s['external_id']) not in existing_keys
        ]
        CalendarEvent.objects.bulk_create(new_events, ignore_conflicts=True)
        events_created = len(new_events)

        # Re-fetch all relevant events keyed by (user_id, external_id)
        all_ext_ids = {s['external_id'] for _u, _p, s in all_session_data}
        event_map = {
            (e.user_id, e.external_id): e
            for e in CalendarEvent.objects.filter(source='timetable', external_id__in=all_ext_ids)
        }

        # Bulk-create missing EventAttendance records
        existing_att = set(
            _EA.objects.filter(
                event__source='timetable', event__external_id__in=all_ext_ids,
            ).values_list('user_id', 'event_id')
        )
        new_att = []
        for user, profile, s in all_session_data:
            event = event_map.get((user.pk, s['external_id']))
            if event is None:
                continue
            if (user.pk, event.pk) in existing_att:
                continue
            base = profile['attend_rate']
            adjusted = profile['type_bias'].get(s['type_label'], base)
            attended = (_stable_hash(f"{user.username}:{s['external_id']}") % 1000) / 1000.0 < adjusted
            new_att.append(_EA(user=user, event=event, attended=attended))
        _EA.objects.bulk_create(new_att, ignore_conflicts=True)
        attendance_created = len(new_att)
=======
                        if s['start'] < now:
                            candidates.append(s)

            if not candidates:
                continue

            candidate_ext_ids = {s['external_id'] for s in candidates}

            # Bulk fetch existing events for this user
            existing_events = {
                e.external_id: e
                for e in CalendarEvent.objects.filter(user=user, external_id__in=candidate_ext_ids)
            }

            # Bulk create missing events
            new_events = [
                CalendarEvent(
                    user=user, source=s['source'], external_id=s['external_id'],
                    title=s['title'], description=s['description'],
                    start_time=s['start'], end_time=s['end'],
                    location=s['location'], priority='high',
                )
                for s in candidates
                if s['external_id'] not in existing_events
            ]
            if new_events:
                CalendarEvent.objects.bulk_create(new_events, ignore_conflicts=True)
                events_created += len(new_events)

            # Re-fetch all events (existing + newly created)
            all_events = {
                e.external_id: e
                for e in CalendarEvent.objects.filter(user=user, external_id__in=candidate_ext_ids)
            }

            # Bulk fetch existing attendance event IDs
            existing_att_ids = set(
                EventAttendance.objects.filter(
                    user=user, event__in=all_events.values()
                ).values_list('event_id', flat=True)
            )

            # Bulk create missing attendance records
            new_att = []
            for s in candidates:
                event = all_events.get(s['external_id'])
                if not event or event.id in existing_att_ids:
                    continue
                base = profile['attend_rate']
                adjusted = profile['type_bias'].get(s['type_label'], base)
                attended = (_stable_hash(f"{user.username}:{s['external_id']}") % 1000) / 1000.0 < adjusted
                new_att.append(EventAttendance(user=user, event=event, attended=attended))
            if new_att:
                EventAttendance.objects.bulk_create(new_att, ignore_conflicts=True)
                attendance_created += len(new_att)
>>>>>>> Stashed changes

        self.stdout.write(f"  Created {events_created} timetable events and {attendance_created} attendance records.")

    def _build_stats(self):
        from studyFlax.models import EventAttendance
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
            ("Attendance",  EventAttendance.objects.count()),
        ]

    def _ordered_fixture_users(self):
        role_order = {'admin': 0, 'student': 1, 'teacher': 2}
        entries = ((item['username'], ROLE_LABELS.get(item['username'], 'student')) for item in FIXTURE_USERS)
        sorted_entries = sorted(entries, key=lambda pair: (role_order.get(pair[1], 1), pair[0]))
        return [(username, _display_role(username, role)) for username, role in sorted_entries]

    def _print_fixture_users(self):
        self.stdout.write("  Fixture users (password: 1234)")
        for username, role in self._ordered_fixture_users():
            self.stdout.write(f"  {username:<12}  {role}")

    def _print_database_stats(self):
        self.stdout.write("  Database")
        for label, count in self._build_stats():
            self.stdout.write(f"  {label:<14}  {count}")

    def print_stats(self):
        div = "\u2500" * 40
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write(self.style.SUCCESS("  Seeding complete"))
        self.stdout.write(self.style.SUCCESS(div))
        self._print_fixture_users()
        self._print_database_stats()
        self.stdout.write(self.style.SUCCESS(div))
