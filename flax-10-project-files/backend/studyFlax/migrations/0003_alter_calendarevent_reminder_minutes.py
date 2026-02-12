from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('studyFlax', '0002_notification'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        DO $$
                        DECLARE
                            col_type TEXT;
                        BEGIN
                            SELECT data_type INTO col_type
                            FROM information_schema.columns
                            WHERE table_name = 'studyFlax_calendarevent'
                                AND column_name = 'reminder_minutes';

                            IF col_type = 'integer' THEN
                                -- Drop check constraint if it exists
                                BEGIN
                                    ALTER TABLE "studyFlax_calendarevent"
                                    DROP CONSTRAINT IF EXISTS "studyFlax_calendarevent_reminder_minutes_check";
                                EXCEPTION WHEN undefined_object THEN
                                    NULL;
                                END;

                                ALTER TABLE "studyFlax_calendarevent"
                                ALTER COLUMN "reminder_minutes" TYPE jsonb
                                USING CASE
                                    WHEN "reminder_minutes" IS NULL THEN '[]'::jsonb
                                    ELSE jsonb_build_array("reminder_minutes")
                                END;
                            END IF;

                            UPDATE "studyFlax_calendarevent"
                            SET "reminder_minutes" = '[]'::jsonb
                            WHERE "reminder_minutes" IS NULL;
                        END $$;
                    """,
                    reverse_sql="""
                        ALTER TABLE "studyFlax_calendarevent"
                        ALTER COLUMN "reminder_minutes" TYPE integer
                        USING CASE
                            WHEN "reminder_minutes" = '[]'::jsonb THEN NULL
                            ELSE ("reminder_minutes"->>0)::integer
                        END;
                    """,
                ),
            ],
            state_operations=[
                migrations.AlterField(
                    model_name='calendarevent',
                    name='reminder_minutes',
                    field=models.JSONField(blank=True, default=list),
                ),
            ],
        ),
    ]
