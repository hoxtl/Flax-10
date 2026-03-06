"""
Add UserSettings.modules column if missing.

Use when the DB is missing the column (e.g. migration 0005 was recorded but not applied).
Uses the same database as runserver. Run from backend dir:

    python manage.py add_usersettings_modules_column
"""

from django.core.management.base import BaseCommand
from django.db import connection
from studyFlax.models.auth.userSettingsModel import UserSettings


class Command(BaseCommand):
    help = "Add studyFlax_usersettings.modules column if missing (safe to run multiple times)."

    def handle(self, *args, **options):
        table = UserSettings._meta.db_table
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s AND column_name = 'modules';
                """,
                [table],
            )
            if cursor.fetchone() is not None:
                self.stdout.write(self.style.SUCCESS(f"Column {table}.modules already exists."))
                return
            cursor.execute(
                f'ALTER TABLE "{table}" ADD COLUMN modules JSONB NOT NULL DEFAULT \'[]\'::jsonb;'
            )
        self.stdout.write(self.style.SUCCESS(f"Added column {table}.modules."))
