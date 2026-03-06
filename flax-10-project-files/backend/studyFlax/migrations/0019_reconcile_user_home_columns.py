from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("studyFlax", "0018_alter_studysession_break_duration_and_more"),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                'ALTER TABLE "studyFlax_user" ADD COLUMN IF NOT EXISTS "home_address" varchar(255) NULL;',
                'ALTER TABLE "studyFlax_user" ADD COLUMN IF NOT EXISTS "home_latitude" double precision NULL;',
                'ALTER TABLE "studyFlax_user" ADD COLUMN IF NOT EXISTS "home_longitude" double precision NULL;',
            ],
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
