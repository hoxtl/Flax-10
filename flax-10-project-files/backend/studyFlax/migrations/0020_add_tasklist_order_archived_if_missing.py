# Add TaskList.order and archived if missing (table may have old schema)

from django.db import migrations


def add_tasklist_columns_if_missing(apps, schema_editor):
    conn = schema_editor.connection
    with conn.cursor() as cursor:
        for col, sql in [
            ("order", 'ALTER TABLE "studyFlax_tasklist" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0'),
            ("archived", 'ALTER TABLE "studyFlax_tasklist" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT FALSE'),
        ]:
            cursor.execute("""
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'studyFlax_tasklist' AND column_name = %s
            """, [col])
            if not cursor.fetchone():
                cursor.execute(sql)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("studyFlax", "0019_add_tasklist_color_if_missing"),
    ]

    operations = [
        migrations.RunPython(add_tasklist_columns_if_missing, noop),
    ]
