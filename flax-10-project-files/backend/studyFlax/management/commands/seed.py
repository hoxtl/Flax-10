import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

from studyFlax.models import (
    User, UserSettings, Category, Tag, 
    RecurrenceRule, CalendarEvent, Notification
)

class Command(BaseCommand):
    help = 'Seeds the database with realistic UK test data'

    def handle(self, *args, **kwargs):
        fake = Faker('en_GB')
        self.stdout.write("Seeding data...")

        # 1. Create 20 Users
        users = []
        for _ in range(20):
            user = User.objects.create_user(
                username=fake.unique.user_name(),
                email=fake.unique.email(),
                password='password123',
                first_name=fake.first_name(),
                last_name=fake.last_name()
            )
            users.append(user)
            
            # Create 20 UserSettings for each user
            UserSettings.objects.create(
                user=user,
                theme=random.choice(['light', 'dark', 'system']),
                timezone='Europe/London'
            )

        # 2. Create exactly 5 Categories
        categories = []
        for _ in range(5):
            cat = Category.objects.create(
                name=fake.word().capitalize(),
                color=fake.hex_color(),
                is_default=random.choice([True, False]),
                user=None
            )
            categories.append(cat)

        # 3. Create exactly 5 Tags (Linked to the Categories)
        tags = []
        for _ in range(5):
            tag = Tag.objects.create(
                name=fake.job()[:50],
                category=random.choice(categories),
                user=None,
                color=fake.hex_color(),
                default_duration=random.choice([30, 60, 90])
            )
            tags.append(tag)

        # 4. Create exactly 5 Recurrence Rules
        recurrences = []
        for _ in range(5):
            rule = RecurrenceRule.objects.create(
                frequency=random.choice(['daily', 'weekly', 'monthly']),
                interval=random.choice([1, 2]),
            )
            recurrences.append(rule)

        # 5. Create exactly 5 Notifications
        for _ in range(5):
            Notification.objects.create(
                title=fake.sentence(nb_words=4),
                message=fake.paragraph(),
                read=random.choice([True, False])
            )

        # 6. Create Calendar Events (Max 5 per day per user)
        # Seeds events for a 2-week window (7 days ago to 7 days ahead)
        today = timezone.now().date()
        for user in users:
            for day_offset in range(-7, 7):
                event_date = today + timedelta(days=day_offset)
                
                # Limit to 5 events per day per user
                num_events = random.randint(1, 5)
                
                for _ in range(num_events):
                    duration = random.choice([30, 60, 90, 120])
                    # Generate a random start time on that specific day
                    start_time = timezone.make_aware(fake.date_time_ad(
                        start_datetime=event_date,
                        end_datetime=event_date,
                    ))
                    end_time = start_time + timedelta(minutes=duration)

                    # Overlap check
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
                            tag=random.choice(tags),
                            priority=random.choice(['low', 'medium', 'high', 'urgent']),
                            recurrence_rule=random.choice([None, random.choice(recurrences)]),
                            reminder_minutes=[15, 30]
                        )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {User.objects.count()} users and related data!'))