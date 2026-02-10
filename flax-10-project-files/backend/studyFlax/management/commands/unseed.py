from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Deletes all data and resets ID sequences for all models'

    def handle(self, *args, **kwargs):
        self.stdout.write("Unseeding data and resetting sequences...")
        
        # List of tables in order of dependency with child tables first
        # Its wrapped in double quotes and looks dumb so that postgresql actually uses the capitalisation of F
        tables = [
            '"studyFlax_calendarevent"',
            '"studyFlax_tag"',
            '"studyFlax_category"',
            '"studyFlax_usersettings"',
            '"studyFlax_recurrencerule"',
            '"studyFlax_timetablesource"',
            '"studyFlax_user"',
        ]

        with connection.cursor() as cursor:
            # CASCADE handles any remaining foreign key constraints
            # RESTART IDENTITY resets the ID counter to 1
            sql = f"TRUNCATE TABLE {', '.join(tables)} RESTART IDENTITY CASCADE;"
            cursor.execute(sql)

        self.stdout.write(self.style.SUCCESS('Successfully cleared all data and reset IDs.'))