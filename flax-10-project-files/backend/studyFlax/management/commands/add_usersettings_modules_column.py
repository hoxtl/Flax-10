"""
Add UserSettings.modules column if missing.

Use when the DB is missing the column (e.g. migration 0005 was recorded but not applied).
Uses the same database as runserver. Run from backend dir:

    python manage.py add_usersettings_modules_column
"""

from django.core.management.base import BaseCommand
from django.db import connection
from studyFlax.models.auth.user_settings_model import UserSettings

def _column_exists(cursor, table):
    cursor.execute(
        """
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s AND column_name = 'modules';
        """,
        [table],
    )
    return cursor.fetchone() is not None

def _add_column(cursor, table):
    cursor.execute(
        f'ALTER TABLE "{table}" ADD COLUMN modules JSONB NOT NULL DEFAULT \'[]\'::jsonb;'
    )

def _apply_migration(cursor, table, stdout, style):
    if _column_exists(cursor, table):
        stdout.write(style.SUCCESS(f"Column {table}.modules already exists."))
        return
    _add_column(cursor, table)
    stdout.write(style.SUCCESS(f"Added column {table}.modules."))

class Command(BaseCommand):
    """Add the missing `modules` column to `UserSettings` when needed."""

    help = "Add studyFlax_usersettings.modules column if missing (safe to run multiple times)."

    def handle(self, *args, **options):
        """Run the column check and add the column when it is missing."""

        table = UserSettings._meta.db_table
        with connection.cursor() as cursor:
            _apply_migration(cursor, table, self.stdout, self.style)
