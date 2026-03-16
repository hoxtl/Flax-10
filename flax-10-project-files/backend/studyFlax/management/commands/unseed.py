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
    'studyFlax_timetablesource',
    'studyFlax_society', 'studyFlax_societymembership', 'studyFlax_societytag',
    'studyFlax_societyevent', 'studyFlax_societyimage',
    'studyFlax_deadline', 'studyFlax_enrollment', 'studyFlax_module',
    'studyFlax_groupproject', 'studyFlax_groupmembership',
    'studyFlax_meetingsuggestion', 'studyFlax_meetingresponse',
    'studyFlax_studysession', 'studyFlax_themesession',
    'studyFlax_reading',
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
    for table in tables:
        cursor.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;')
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
    stdout.write(style.WARNING("  Run `python manage.py createsuperuser` to recreate them manually."))

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
    div = "─" * 40
    stdout.write("")
    stdout.write(div)
    stdout.write("  ⚠️   python manage.py unseed")
    stdout.write(div)
    stdout.write("")
    stdout.write(f"  This will wipe {len(TABLES)} tables and reset all sequences.")
    stdout.write("  Superusers will be preserved and restored after.")
    stdout.write("")
    answer = input("  Type 'yes' to confirm: ")
    stdout.write("")
    return answer == 'yes'

class Command(BaseCommand):
    """Clears all application data and resets database sequences."""

    help = 'Cleans the database using PostgreSQL TRUNCATE CASCADE, preserving superusers.'

    def handle(self, *args, **options):
        superusers_data = get_superuser_data()
        if not superusers_data:
            self.stdout.write(self.style.WARNING("  No superusers found — database will be completely emptied."))
        if not confirm_truncate(self.stdout):
            self.stdout.write("  Cancelled.")
            return
        self.stdout.write("  Clearing tables...")
        with connection.cursor() as cursor:
            truncate_tables(cursor, TABLES, self.stdout)
        self.stdout.write("\n  Restoring superusers...")
        failed_restores = restore_superusers(superusers_data, self.stdout)
        _print_restore_results(superusers_data, failed_restores, self.stdout, self.style)
        _print_success_footer(self.stdout, self.style)
