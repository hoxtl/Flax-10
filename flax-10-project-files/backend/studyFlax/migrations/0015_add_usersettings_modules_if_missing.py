# Add studyFlax_usersettings.modules if missing (fix for DBs where 0005 was recorded but not applied)

from django.db import migrations


def add_modules_column_if_missing(apps, schema_editor):
    # Use the same table name Django uses (app_label + '_' + model_name)
    UserSettings = apps.get_model("studyFlax", "UserSettings")
    table = UserSettings._meta.db_table
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = %s;
            """,
            [table],
        )
        if cursor.fetchone() is None:
            return
        cursor.execute(
            """
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s AND column_name = 'modules';
            """,
            [table],
        )
        if cursor.fetchone() is None:
            # Quote table name for PostgreSQL in case it has mixed case
            cursor.execute(
                f'ALTER TABLE "{table}" ADD COLUMN modules JSONB NOT NULL DEFAULT \'[]\'::jsonb;'
            )


class Migration(migrations.Migration):

    dependencies = [
        ('studyFlax', '0014_merge_20260303_2255'),
    ]

    operations = [
        migrations.RunPython(add_modules_column_if_missing, migrations.RunPython.noop),
    ]
