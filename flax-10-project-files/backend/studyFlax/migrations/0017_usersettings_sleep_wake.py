# Add UserSettings.sleep_time and wake_time if missing (NOT NULL with defaults for seed)

from django.db import migrations


def add_sleep_wake_if_missing(apps, schema_editor):
    UserSettings = apps.get_model("studyFlax", "UserSettings")
    table = UserSettings._meta.db_table
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s AND column_name = 'sleep_time';
            """,
            [table],
        )
        if cursor.fetchone() is not None:
            return
        cursor.execute(
            f'ALTER TABLE "{table}" ADD COLUMN sleep_time TIME NOT NULL DEFAULT \'23:00:00\';'
        )
        cursor.execute(
            f'ALTER TABLE "{table}" ADD COLUMN wake_time TIME NOT NULL DEFAULT \'07:00:00\';'
        )


class Migration(migrations.Migration):

    dependencies = [
        ("studyFlax", "0016_add_calendarevent_is_private_if_missing"),
    ]

    operations = [
        migrations.RunPython(add_sleep_wake_if_missing, migrations.RunPython.noop),
    ]
