# Make TaskList.created_at and updated_at nullable (old schema had NOT NULL)

from django.db import migrations


def make_datetime_columns_nullable(apps, schema_editor):
    conn = schema_editor.connection
    with conn.cursor() as cursor:
        for col in ("created_at", "updated_at"):
            cursor.execute("""
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'studyFlax_tasklist' AND column_name = %s
            """, [col])
            if cursor.fetchone():
                cursor.execute(f'ALTER TABLE "studyFlax_tasklist" ALTER COLUMN "{col}" DROP NOT NULL')


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("studyFlax", "0021_make_tasklist_category_nullable"),
    ]

    operations = [
        migrations.RunPython(make_datetime_columns_nullable, noop),
    ]
