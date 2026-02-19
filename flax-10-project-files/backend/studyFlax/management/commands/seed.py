import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from faker import Faker

from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent, UserSettings, User
)

from studyFlax.fixtures.data_fixtures import (
    category_fixtures, tag_fixtures, recurrence_fixtures,
    event_title_fixtures, course_fixtures, description_fixtures, location_fixtures
)

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with structured data based on fixtures and Faker.'

    # Config
    USER_COUNT = 25
    EVENTS_PER_USER_RANGE = (60, 90)
    DEFAULT_PASSWORD = '1234'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.faker = Faker('en_GB')

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting seeding process...'))

        self.create_admin_user()

        self.create_random_users()
        self.users = list(User.objects.filter(is_staff=False))

        self.create_recurrence_rules()
        self.create_categories()
        self.categories = list(Category.objects.all())
        self.create_tags()
        self.tags = list(Tag.objects.all())
        self.rules = list(RecurrenceRule.objects.all())

        self.create_events_for_users()

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
        self.print_stats()

    def create_admin_user(self):
        """Ensures John Doe superuser exists."""
        adminName = 'johndoe'
        if User.objects.filter(username=adminName).exists():
            self.stdout.write(f"Admin user '{adminName}' already exists.")
        else:
            User.objects.create_superuser(
                username=adminName,
                email='john.doe@example.com',
                password=self.DEFAULT_PASSWORD,
                first_name='John',
                last_name='Doe'
            )
            self.stdout.write(self.style.SUCCESS(f"Created admin user: {adminName}"))

    def create_random_users(self):
        """Creates fake users based on number in USER_COUNT."""
        current_count = User.objects.count()
        needed = self.USER_COUNT - current_count

        if needed <= 0:
            self.stdout.write("Enough users already exist.")
            return

        self.stdout.write(f"Seeding {needed} users...")
        users_to_create = []
        for _ in range(needed):
            while True:
                first_name = self.faker.first_name()
                last_name = self.faker.last_name()

                if not User.objects.filter(first_name=first_name, last_name=last_name).exists() and not any(u.first_name == first_name and u.last_name == last_name for u in users_to_create):
                    break

            base_username = f"{first_name.lower()}.{last_name.lower()}"
            username = base_username
            counter = 2
            while User.objects.filter(username=username).exists() or any(u.username == username for u in users_to_create):
                username = f"{base_username}{counter}"
                counter += 1

            email = f"{first_name.lower()}.{last_name.lower()}@kcl.ac.uk"

            user = User(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name
            )
            user.set_password(self.DEFAULT_PASSWORD)
            users_to_create.append(user)

        User.objects.bulk_create(users_to_create, ignore_conflicts=True)

        new_users = User.objects.filter(settings__isnull=True)
        settings_to_create = []
        for user in new_users:
            settings_to_create.append(UserSettings(
                user=user,
                theme=random.choice(['light', 'dark']),
                timezone='Europe/London',
                year=random.choice(['Foundation', 'Year 1', 'Year 2', 'Year 3', 'Year 4']),
                major=random.choice(course_fixtures),
            ))
        UserSettings.objects.bulk_create(settings_to_create)

    def create_recurrence_rules(self):
        """Creates base recurrence rules from fixtures."""
        self.stdout.write("Seeding recurrence rules...")
        for freq, interval in recurrence_fixtures:
            RecurrenceRule.objects.get_or_create(
                frequency=freq,
                interval=interval
            )

    def create_categories(self):
        """Creates categories from fixtures."""
        self.stdout.write("Seeding categories...")
        for name, color, is_default in category_fixtures:
            user = None
            if not is_default and self.users and random.random() > 0.7:
                user = random.choice(self.users)

            Category.objects.get_or_create(
                name=name,
                user=user,
                defaults={'color': color, 'is_default': is_default}
            )

    def create_tags(self):
        """Creates tags from fixtures, linking to categories randomly."""
        self.stdout.write("Seeding tags...")
        for name, duration in tag_fixtures:
            category = None
            if self.categories and random.random() > 0.3:
                category = random.choice(self.categories)

            user = None
            if category and category.user:
                user = category.user
            elif self.users and random.random() > 0.7:
                user = random.choice(self.users)

            Tag.objects.get_or_create(
                name=name,
                user=user,
                defaults={
                    'category': category,
                    'default_duration': duration,
                    'color': self.faker.hex_color(),
                }
            )

    def create_events_for_users(self):
        """Iterates through users and creates random events for them."""
        self.stdout.write("Seeding events for users...")

        priority_choices = ['low', 'medium', 'high', 'urgent']
        time_slots = [8, 10, 12, 14, 16, 18, 20]
        total_events = 0

        for i, user in enumerate(self.users):
            print(f"Processing user {i+1}/{len(self.users)}: {user.username}", end='\r')

            num_events = self.faker.random_int(*self.EVENTS_PER_USER_RANGE)
            user_tags = [t for t in self.tags if t.user == user or t.user is None]

            events_to_create = []
            used_titles_per_week = {}

            for _ in range(num_events):
                day_offset = self.faker.random_int(0, 60)
                week_number = day_offset // 7

                used_this_week = used_titles_per_week.get(week_number, set())
                available_titles = [t for t in event_title_fixtures if t not in used_this_week]

                if not available_titles:
                    continue

                title = random.choice(available_titles)
                used_titles_per_week.setdefault(week_number, set()).add(title)

                hour = random.choice(time_slots)
                start_time = timezone.now().replace(
                    hour=hour, minute=0, second=0, microsecond=0
                ) + timedelta(days=day_offset)
                duration_minutes = random.choice([60, 90, 120])
                end_time = start_time + timedelta(minutes=duration_minutes)

                tag = random.choice(user_tags) if user_tags and random.random() > 0.2 else None
                rule = random.choice(self.rules) if self.rules and random.random() > 0.8 else None

                events_to_create.append(CalendarEvent(
                    user=user,
                    title=title,
                    description=random.choice(description_fixtures) if random.random() > 0.3 else "",
                    start_time=start_time,
                    end_time=end_time,
                    location=random.choice(location_fixtures) if random.random() > 0.7 else None,
                    tag=tag,
                    priority=random.choice(priority_choices),
                    recurrence_rule=rule
                ))

            CalendarEvent.objects.bulk_create(events_to_create)
            total_events += len(events_to_create)

        print(f"\nCreated {total_events} events across {len(self.users)} users.")

    def print_stats(self):
        print("="*30)
        print(f"Users: {User.objects.count()}")
        print(f"Categories: {Category.objects.count()}")
        print(f"Tags: {Tag.objects.count()}")
        print(f"Events: {CalendarEvent.objects.count()}")
        print("="*30)