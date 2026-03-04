# Add TaskList.color if missing (table may exist from older migration)

from django.db import migrations


def add_color_if_missing(apps, schema_editor):
    conn = schema_editor.connection
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'studyFlax_tasklist' AND column_name = 'color'
        """)
        if cursor.fetchone():
            return
        cursor.execute("""
            ALTER TABLE "studyFlax_tasklist"
            ADD COLUMN "color" varchar(32) NULL
        """)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("studyFlax", "0018_add_task_and_tasklist"),
    ]

    operations = [
        migrations.RunPython(add_color_if_missing, noop),
    ]
