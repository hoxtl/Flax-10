from django.core.management.base import BaseCommand
from django.db import connection
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Cleans the database using PostgreSQL TRUNCATE CASCADE, preserving superusers.'

    def handle(self, *args, **options):
        superuser_ids = list(User.objects.filter(is_superuser=True).values_list('id', flat=True))

        if not superuser_ids:
            self.stdout.write(self.style.WARNING("No superusers found. The database will be completely emptied."))

        tables_to_truncate = [
            'studyFlax_calendarevent',
            'studyFlax_tag',
            'studyFlax_category',
            'studyFlax_recurrencerule',
            'studyFlax_usersettings',
            'studyFlax_notification',
            'studyFlax_timetablesource',
            'studyFlax_user', 
        ]

        self.stdout.write(self.style.WARNING(f"About to TRUNCATE the following tables: {', '.join(tables_to_truncate)}"))
        confirm = input("Are you sure? This is irreversible. (yes/no): ")
        if confirm != 'yes':
            self.stdout.write("Operation cancelled.")
            return

        with connection.cursor() as cursor:
            superusers_data = []
            if superuser_ids:
                superusers_data = list(User.objects.filter(id__in=superuser_ids).values())

            try:
                # Disable constraint checks temporarily for cleaner truncation if needed, though CASCADE usually handles it.
                # cursor.execute("SET CONSTRAINTS ALL DEFERRED;")
                
                for table in tables_to_truncate:
                    cursor.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE;')
                    self.stdout.write(f"Truncated {table}.")
            finally:
                 # cursor.execute("SET CONSTRAINTS ALL IMMEDIATE;")
                 pass

            # Restore Superusers
            if superusers_data:
                self.stdout.write("Restoring superusers...")
                User.objects.bulk_create([User(**data) for data in superusers_data])

        self.stdout.write(self.style.SUCCESS('Database cleaned successfully. Superusers restored.'))