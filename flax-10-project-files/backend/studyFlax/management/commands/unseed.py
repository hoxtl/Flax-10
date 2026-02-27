from django.core.management.base import BaseCommand
from django.db import connection
from django.contrib.auth import get_user_model

User = get_user_model()

TABLES = [
    'studyFlax_deadline',
    'studyFlax_enrollment',
    'studyFlax_module',
    'studyFlax_calendarevent',
    'studyFlax_tag',
    'studyFlax_category',
    'studyFlax_task',
    'studyFlax_tasklist',
    'studyFlax_recurrencerule',
    'studyFlax_usersettings',
    'studyFlax_notification',
    'studyFlax_timetablesource',
    'studyFlax_user',
    'studyFlax_studysession',
    'studyFlax_themesession',
]

SUPERUSER_RESTORE_FIELDS = {'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_staff', 'role'}


def get_superuser_data():
    return [
        {k: v for k, v in u.items() if k in SUPERUSER_RESTORE_FIELDS}
        for u in User.objects.filter(is_superuser=True).values()
    ]


def truncate_tables(cursor, tables, stdout):
    for table in tables:
        cursor.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;')
        stdout.write(f"  ✓  {table}")


def restore_superusers(superusers_data, stdout):
    if not superusers_data:
        return
    for data in superusers_data:
        User.objects.create_superuser(password='1234', **data)


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
    help = 'Cleans the database using PostgreSQL TRUNCATE CASCADE, preserving superusers.'

    def handle(self, *args, **options):
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
