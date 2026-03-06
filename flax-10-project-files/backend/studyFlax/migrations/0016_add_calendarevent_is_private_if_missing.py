# Add CalendarEvent.is_private if missing (fix for DBs where 0006 was recorded but not applied)

from django.db import migrations


def add_is_private_if_missing(apps, schema_editor):
    CalendarEvent = apps.get_model("studyFlax", "CalendarEvent")
    table = CalendarEvent._meta.db_table
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s AND column_name = 'is_private';
            """,
            [table],
        )
        if cursor.fetchone() is not None:
            return
        cursor.execute(
            f'ALTER TABLE "{table}" ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;'
        )


class Migration(migrations.Migration):

    dependencies = [
        ("studyFlax", "0015_add_usersettings_modules_if_missing"),
    ]

    operations = [
        migrations.RunPython(add_is_private_if_missing, migrations.RunPython.noop),
    ]
