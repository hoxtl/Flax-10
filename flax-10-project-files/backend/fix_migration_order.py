#!/usr/bin/env python
"""
One-off fix: insert missing 0005_usersettings_modules into django_migrations
so migration history is consistent (0006 was applied before 0005).
Run from backend dir: .venv/bin/python fix_migration_order.py
"""
import os
import sys
import django

# Add parent so we can import settings
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Flax10.settings")
django.setup()

from django.db import connection

# Insert missing migrations so history is consistent (order was wrong on DB)
# Full chain: 0001 -> 0002 -> 0003_follow -> 0005 -> 0006_add_is_private -> 0007_user_weekly_goal_hours
to_insert = [
    ('studyFlax', '0002_deadline'),
    ('studyFlax', '0003_follow'),
    ('studyFlax', '0005_usersettings_modules'),
    ('studyFlax', '0006_add_is_private_to_calendar_event'),
]
with connection.cursor() as cursor:
    for app, name in to_insert:
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
print("Inserted missing migration(s) into django_migrations.")
