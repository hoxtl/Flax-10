"""
Django management command for clearing the database.

Run with::

    python manage.py unseed

Truncates all application tables using TRUNCATE … RESTART IDENTITY CASCADE,
then re-creates any superuser accounts that existed before the wipe.
Requires explicit confirmation from the operator before proceeding.
"""

from django.core.management.base import BaseCommand
from django.db import IntegrityError, connection
from django.contrib.auth import get_user_model

User = get_user_model()

TABLES = [
    'studyFlax_calendarevent', 'studyFlax_tag', 'studyFlax_category',
    'studyFlax_recurrencerule', 'studyFlax_usersettings', 'studyFlax_notification',
    'studyFlax_timetablesource', 'studyFlax_eventattendance', 'studyFlax_calendarshare',
    'studyFlax_schedule', 'studyFlax_scheduleeventallocation',
    'studyFlax_society', 'studyFlax_societymembership', 'studyFlax_societytag',
    'studyFlax_societyevent', 'studyFlax_societyimage', 'studyFlax_societyannouncement',
    'studyFlax_societyannouncementimage', 'studyFlax_societyreport', 'studyFlax_societycalendarsync',
    'studyFlax_deadline', 'studyFlax_enrollment', 'studyFlax_module',
    'studyFlax_groupproject', 'studyFlax_groupmembership',
    'studyFlax_meetingsuggestion', 'studyFlax_meetingresponse',
    'studyFlax_studysession', 'studyFlax_themesession',
    'studyFlax_reading', 'studyFlax_task', 'studyFlax_tasklist',
    'studyFlax_coursechangerequest',
    'studyFlax_user',
]

SUPERUSER_RESTORE_FIELDS = {'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_staff', 'role'}

def get_superuser_data():
    """Return serialised superuser records, excluding auth-only and audit fields."""

    return [
        {k: v for k, v in u.items() if k in SUPERUSER_RESTORE_FIELDS}
        for u in User.objects.filter(is_superuser=True).values()
    ]

def truncate_tables(cursor, tables, stdout):
    """Truncate the supplied tables and echo each cleared table name."""

    # Truncate in a single statement so PostgreSQL acquires the table locks
    # in one consistent pass instead of deadlocking halfway through.
    quoted_tables = ', '.join(f'"{table}"' for table in tables)
    cursor.execute(f'TRUNCATE TABLE {quoted_tables} RESTART IDENTITY CASCADE;')
    for table in tables:
        stdout.write(f"  ✓  {table}")

def _build_superuser_payload(data):
    return {
        "username": data.get("username"),
        "email": data.get("email"),
        "first_name": data.get("first_name") or "",
        "last_name": data.get("last_name") or "",
        "is_superuser": True,
        "is_staff": True,
        "role": data.get("role") or "teacher",
    }

def _attempt_restore(payload):
    try:
        User.objects.create_superuser(password='1234', **payload)
        return None
    except (IntegrityError, TypeError, ValueError) as exc:
        return (payload.get("username", "?"), str(exc))

def restore_superusers(superusers_data, stdout):
    """Restore preserved superusers after the database wipe completes."""

    del stdout
    if not superusers_data:
        return []
    results = [_attempt_restore(_build_superuser_payload(d)) for d in superusers_data]
    return [r for r in results if r is not None]

def _print_restore_warnings(failed_restores, stdout, style):
    if not failed_restores:
        return
    stdout.write("")
    stdout.write(style.WARNING("  ⚠️  Some superusers could not be restored automatically."))
    for username, reason in failed_restores:
        stdout.write(style.WARNING(f"     - {username}: {reason}"))
    stdout.write(style.WARNING("  Run python manage.py createsuperuser to recreate them manually."))

def _print_restore_results(superusers_data, failed_restores, stdout, style):
    failed_names = {name for name, _ in failed_restores}
    for su in superusers_data:
        username = su.get("username", "?")
        prefix = "  ✓" if username not in failed_names else "  ✗"
        stdout.write(f"{prefix}  {username}")
    _print_restore_warnings(failed_restores, stdout, style)

def _print_success_footer(stdout, style):
    div = "─" * 40
    stdout.write("")
    stdout.write(style.SUCCESS(div))
    stdout.write(style.SUCCESS("  ✅  Database cleared"))
    stdout.write(style.SUCCESS(div))
    stdout.write("")
    stdout.write("  Run  python manage.py seed  to reseed.")
    stdout.write("")

def confirm_truncate(stdout):
    """Prompt for confirmation before wiping the seeded tables."""

    for line in _confirm_truncate_lines():
        stdout.write(line)
    answer = input("  Type 'yes' to confirm: ")
    stdout.write("")
    return answer == 'yes'


def _confirm_truncate_lines():
    div = "─" * 40
    return [
        "",
        div,
        "  ⚠️   python manage.py unseed",
        div,
        "",
        f"  This will wipe {len(TABLES)} tables and reset all sequences.",
        "  Superusers will be preserved and restored after.",
        "",
    ]

class Command(BaseCommand):
    """Clears all application data and resets database sequences."""

    help = 'Cleans the database using PostgreSQL TRUNCATE CASCADE, preserving superusers.'

    def handle(self, *args, **options):
        """Clear seeded data and restore any pre-existing superusers."""

        superusers_data = get_superuser_data()
        self._warn_on_empty_superusers(superusers_data)
        if not self._confirmed():
            return
        self._clear_tables()
        self._restore_superusers(superusers_data)

    def _warn_on_empty_superusers(self, superusers_data):
        if not superusers_data:
            self.stdout.write(self.style.WARNING("  No superusers found - database will be completely emptied."))

    def _confirmed(self):
        if confirm_truncate(self.stdout):
            return True
        self.stdout.write("  Cancelled.")
        return False

    def _clear_tables(self):
        self.stdout.write("  Clearing tables...")
        with connection.cursor() as cursor:
            truncate_tables(cursor, TABLES, self.stdout)

    def _restore_superusers(self, superusers_data):
        self.stdout.write("\n  Restoring superusers...")
        failed_restores = restore_superusers(superusers_data, self.stdout)
        _print_restore_results(superusers_data, failed_restores, self.stdout, self.style)
        _print_success_footer(self.stdout, self.style)
