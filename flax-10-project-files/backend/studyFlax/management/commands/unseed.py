from django.core.management.base import BaseCommand
from django.db import connection
from django.contrib.auth import get_user_model

User = get_user_model()

TABLES = [
    # 'studyFlax_deadline',
    'studyFlax_enrollment',
    'studyFlax_module',
    'studyFlax_calendarevent',
    'studyFlax_tag',
    'studyFlax_category',
    # 'studyFlax_task',
    # 'studyFlax_tasklist',
    'studyFlax_recurrencerule',
    'studyFlax_usersettings',
    'studyFlax_notification',
    'studyFlax_timetablesource',
    'studyFlax_user',
]


def get_superuser_data():
    ids = list(User.objects.filter(is_superuser=True).values_list('id', flat=True))
    return list(User.objects.filter(id__in=ids).values()) if ids else []


def truncate_tables(cursor, tables, stdout):
    for table in tables:
        cursor.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;')
        stdout.write(f"  Truncated {table}.")


def restore_superusers(superusers_data, stdout):
    if not superusers_data:
        return
    stdout.write("Restoring superusers...")
    for data in superusers_data:
        User.objects.create_superuser(**data)


def confirm_truncate(tables, stdout):
    stdout.write(f"About to TRUNCATE: {', '.join(tables)}")
    return input("Are you sure? This is irreversible. (yes/no): ") == 'yes'


class Command(BaseCommand):
    help = 'Cleans the database using PostgreSQL TRUNCATE CASCADE, preserving superusers.'

    def handle(self, *args, **options):
        superusers_data = get_superuser_data()
        if not superusers_data:
            self.stdout.write(self.style.WARNING(
                "No superusers found. Database will be completely emptied."
            ))
        if not confirm_truncate(TABLES, self.stdout):
            self.stdout.write("Operation cancelled.")
            return
        with connection.cursor() as cursor:
            truncate_tables(cursor, TABLES, self.stdout)
        restore_superusers(superusers_data, self.stdout)
        self.stdout.write(self.style.SUCCESS(
            'Database cleaned. Superusers restored. '
            'Fixture users (johndoe, janedoe, charlie) will be recreated on next seed.'
        ))