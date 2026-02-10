import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

from studyFlax.models import (
    User, UserSettings, Category, Tag, 
    RecurrenceRule, CalendarEvent, TimetableSource
)

class Command(BaseCommand):
    help = 'Seeds the database with realistic UK test data'

    def handle(self, *args, **kwargs):
        fake = Faker('en_GB')
        self.stdout.write("Seeding data...")

        users = []
        for _ in range(5):
            user = User.objects.create_user(
                username=fake.user_name(),
                email=fake.unique.email(),
                password='password123',
                first_name=fake.first_name(),
                last_name=fake.last_name()
            )
            users.append(user)
            
            # Create UserSettings for each user
            UserSettings.objects.create(
                user=user,
                theme=random.choice(['light', 'dark', 'system']),
                timezone='Europe/London'
            )

        # Create Categories
        categories = []
        for user in users:
            for _ in range(3):
                cat = Category.objects.create(
                    name=fake.word().capitalize(),
                    color=fake.hex_color(),
                    is_default=False,
                    user=user
                )
                categories.append(cat)

        # Create Tags
        tags = []
        for user in users:
            user_cats = [c for c in categories if c.user == user]
            for _ in range(5):
                tag = Tag.objects.create(
                    name=fake.job(),
                    category=random.choice(user_cats),
                    user=user,
                    color=fake.hex_color(),
                    default_duration=random.choice([30, 60, 90])
                )
                tags.append(tag)

        # Create Recurrence Rules
        recurrences = []
        for _ in range(5):
            rule = RecurrenceRule.objects.create(
                frequency=random.choice(['daily', 'weekly', 'monthly']),
                interval=random.choice([1, 2]),
            )
            recurrences.append(rule)

        # Create Calendar Events
        for user in users:
            user_tags = Tag.objects.filter(user=user)
            if not user_tags.exists(): continue

            events_created = 0
            attempts = 0

            while events_created < 10 and attempts < 50:
                attempts += 1

                duration = random.choice([30, 60, 90, 120]) # minutes
                start_time = fake.date_time_this_month(
                    before_now=False,
                    after_now=True,
                    tzinfo=timezone.get_current_timezone()
                )
                end_time = start_time + timedelta(minutes=duration)

                # Following code makes sure events don't overlap

                overlap = CalendarEvent.objects.filter(
                    user=user,
                    start_time__lt=end_time,
                    end_time__gt=start_time
                ).exists()

                if not overlap:
                    CalendarEvent.objects.create(
                        user=user,
                        title=fake.catch_phrase(),
                        start_time=start_time,
                        end_time=end_time,
                        tag=random.choice(user_tags),
                        priority=random.choice(['low', 'medium', 'high'])
                    )
                    events_created += 1

        # Timetable Sources
        # for _ in range(3):
        #     TimetableSource.objects.create(
        #         source_url=fake.unique.url(),
        #         last_synced=timezone.now()
        #     )

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))