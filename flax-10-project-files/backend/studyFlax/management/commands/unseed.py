from django.core.management.base import BaseCommand
from django.db import connection, models
from django.contrib.auth import get_user_model

User = get_user_model()

TABLES = [
    'studyFlax_task', 'studyFlax_tasklist',
    'studyFlax_calendarevent', 'studyFlax_tag', 'studyFlax_category',
    'studyFlax_recurrencerule', 'studyFlax_usersettings', 'studyFlax_notification',
    'studyFlax_timetablesource', 'studyFlax_enrollment', 'studyFlax_module',
    'studyFlax_user',
]

PROTECTED_USERNAMES = ['johndoe', 'janedoe', 'charlie']


def get_superuser_data():
    users = User.objects.filter(
        models.Q(is_superuser=True) | models.Q(username__in=PROTECTED_USERNAMES)
    )
    return list(users.values())


def truncate_tables(cursor, tables, stdout):
    for table in tables:
        cursor.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;')
        stdout.write(f"  Truncated {table}.")


def restore_superusers(superusers_data, stdout):
    if not superusers_data:
        return
    stdout.write("Restoring protected users...")
    User.objects.bulk_create([User(**data) for data in superusers_data])


def confirm_truncate(tables, stdout):
    stdout.write(f"About to TRUNCATE: {', '.join(tables)}")
    return input("Are you sure? This is irreversible. (yes/no): ") == 'yes'


class Command(BaseCommand):
    help = 'Cleans the database using PostgreSQL TRUNCATE CASCADE, preserving superusers and fixture users.'

    def handle(self, *args, **options):
        superusers_data = get_superuser_data()
        if not superusers_data:
            self.stdout.write(
                self.style.WARNING("No protected users found. Database will be completely emptied.")
            )
        if not confirm_truncate(TABLES, self.stdout):
            self.stdout.write("Operation cancelled.")
            return
        with connection.cursor() as cursor:
            truncate_tables(cursor, TABLES, self.stdout)
        restore_superusers(superusers_data, self.stdout)
        self.stdout.write(self.style.SUCCESS('Database cleaned. Protected users restored.'))