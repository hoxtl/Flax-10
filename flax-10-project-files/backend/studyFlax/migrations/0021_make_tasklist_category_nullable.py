# Make TaskList.category nullable (table may have NOT NULL from older schema)

from django.db import migrations


def make_category_nullable(apps, schema_editor):
    conn = schema_editor.connection
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'studyFlax_tasklist'
            AND column_name IN ('category', 'category_id')
        """)
        row = cursor.fetchone()
        if not row:
            return
        col = row[0]
        cursor.execute(f'ALTER TABLE "studyFlax_tasklist" ALTER COLUMN "{col}" DROP NOT NULL')


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("studyFlax", "0020_add_tasklist_order_archived_if_missing"),
    ]

    operations = [
        migrations.RunPython(make_category_nullable, noop),
    ]
