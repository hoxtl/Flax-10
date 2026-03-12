"""
Django management command for clearing the database.

Run with::

    python manage.py unseed

Truncates all application tables using TRUNCATE … RESTART IDENTITY CASCADE,
then re-creates any superuser accounts that existed before the wipe.
Requires explicit confirmation from the operator before proceeding.
"""

from django.core.management.base import BaseCommand
from django.db import connection
from django.contrib.auth import get_user_model

User = get_user_model()

TABLES = [
    'studyFlax_calendarevent', 'studyFlax_tag', 'studyFlax_category',
    'studyFlax_recurrencerule', 'studyFlax_usersettings', 'studyFlax_notification',
    'studyFlax_timetablesource', 'studyFlax_user',
    'studyFlax_society', 'studyFlax_societymembership', 'studyFlax_societytag',
    'studyFlax_societyevent', 'studyFlax_societyimage',
    'studyFlax_deadline',
    'studyFlax_enrollment',
    'studyFlax_module',
    'studyFlax_calendarevent',
    'studyFlax_tag',
    'studyFlax_category',
    #'studyFlax_task',
    #'studyFlax_tasklist',
    'studyFlax_recurrencerule',
    'studyFlax_usersettings',
    'studyFlax_notification',
    'studyFlax_timetablesource',
    'studyFlax_user',
    'studyFlax_groupproject', 'studyFlax_groupmembership',
    'studyFlax_meetingsuggestion', 'studyFlax_meetingresponse',
    'studyFlax_studysession',
    'studyFlax_themesession',
]

SUPERUSER_RESTORE_FIELDS = {'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_staff', 'role'}


def get_superuser_data():
    """Return serialised superuser records, excluding auth-only and audit fields.

    The returned dicts are suitable for passing directly to
    User.objects.create_superuser after the wipe.
    """
    return [
        {k: v for k, v in u.items() if k in SUPERUSER_RESTORE_FIELDS}
        for u in User.objects.filter(is_superuser=True).values()
    ]


def truncate_tables(cursor, tables, stdout):
    """TRUNCATE each table in *tables* with RESTART IDENTITY CASCADE."""
    for table in tables:
        cursor.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;')
        stdout.write(f"  ✓  {table}")


def restore_superusers(superusers_data, stdout):
    """Re-create each superuser from the serialised data saved before the wipe."""
    if not superusers_data:
        return
    for data in superusers_data:
        User.objects.create_superuser(password='1234', **data)


def confirm_truncate(stdout):
    """Print a confirmation prompt and return True only if the operator types 'yes'."""
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
    """Clears all application data and resets database sequences.

    Superusers are snapshotted before the wipe and restored afterwards so
    that the development environment remains accessible after an unseed.
    """

    help = 'Cleans the database using PostgreSQL TRUNCATE CASCADE, preserving superusers.'

    def handle(self, *args, **options):
        """Snapshot superusers, confirm intent, truncate tables, and restore superusers."""
        superusers_data = get_superuser_data()
        if not superusers_data:
            self.stdout.write(self.style.WARNING("  No superusers found — database will be completely emptied."))

        if not confirm_truncate(self.stdout):
            self.stdout.write("  Cancelled.")
            self.stdout.write("")
            return

        self.stdout.write("  Clearing tables...")
        with connection.cursor() as cursor:
            truncate_tables(cursor, TABLES, self.stdout)

        self.stdout.write("")
        self.stdout.write("  Restoring superusers...")
        restore_superusers(superusers_data, self.stdout)
        for su in superusers_data:
            self.stdout.write(f"  ✓  {su.get('username', '?')}")

        div = "─" * 40
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write(self.style.SUCCESS("  ✅  Database cleared"))
        self.stdout.write(self.style.SUCCESS(div))
        self.stdout.write("")
        self.stdout.write("  Run  python manage.py seed  to reseed.")
        self.stdout.write("")
