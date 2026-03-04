#!/usr/bin/env python
"""
One-off script to fix inconsistent migration history after merging main into
feature/task-management-new. Marks migrations as applied so the DB matches
the merged migration graph. Run from backend dir with venv active:

  python fix_migration_history.py

Then run: python manage.py makemigrations (or migrate) as needed.
"""
import os
import sys

# Minimal Django setup without loading migration graph
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Flax10.settings")

import django
django.setup()

from django.db import connection

# Migrations that must be marked applied so the merged graph matches the DB
TO_RECORD = [
    ("studyFlax", "0002_deadline"),
    ("studyFlax", "0003_follow"),
    ("studyFlax", "0005_usersettings_modules"),
    ("studyFlax", "0006_add_is_private_to_calendar_event"),
]

def main():
    with connection.cursor() as cursor:
        for app, name in TO_RECORD:
            cursor.execute(
                """
                INSERT INTO django_migrations (app, name, applied)
                SELECT %s, %s, NOW()
                WHERE NOT EXISTS (
                    SELECT 1 FROM django_migrations WHERE app = %s AND name = %s
                )
                """,
                [app, name, app, name],
            )
    print("Marked as applied:", TO_RECORD)
    print("Run: python manage.py makemigrations")

if __name__ == "__main__":
    main()
