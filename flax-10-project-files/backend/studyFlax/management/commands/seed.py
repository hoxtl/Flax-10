import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from faker import Faker

from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent, UserSettings, User, Module, Enrollment, Deadline
)

from studyFlax.fixtures.data_fixtures import (
    category_fixtures, tag_fixtures, recurrence_fixtures,
    event_title_fixtures, course_fixtures, description_fixtures,
    location_fixtures, lecture_theatre_fixtures, module_fixtures,
    course_to_module_prefixes, deadline_fixtures, module_deadline_fixtures
)

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with structured data based on fixtures and Faker.'

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

        self.create_modules()
        self.modules = list(Module.objects.all())
        self.create_deadlines()
        self.create_enrollments()

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
                if (not User.objects.filter(first_name=first_name, last_name=last_name).exists()
                        and not any(u.first_name == first_name and u.last_name == last_name for u in users_to_create)):
                    break

            base_username = f"{first_name.lower()}.{last_name.lower()}"
            username = base_username
            counter = 2
            while User.objects.filter(username=username).exists() or any(u.username == username for u in users_to_create):
                username = f"{base_username}{counter}"
                counter += 1

            email = f"{first_name.lower()}.{last_name.lower()}@kcl.ac.uk"
            user = User(username=username, email=email, first_name=first_name, last_name=last_name)
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
            RecurrenceRule.objects.get_or_create(frequency=freq, interval=interval)

    def create_categories(self):
        """Creates categories from fixtures."""
        self.stdout.write("Seeding categories...")
        for name, color, is_default in category_fixtures:
            user = None
            if not is_default and self.users and random.random() > 0.7:
                user = random.choice(self.users)
            Category.objects.get_or_create(
                name=name, user=user,
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
                name=name, user=user,
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

    def get_next_weekday(self, weekday_offset):
        """Returns a date that lands on a weekday (Mon-Fri). weekday_offset 0=Mon, 4=Fri."""
        now = timezone.now()
        # Start from tomorrow to avoid today
        days_ahead = 1
        candidate = now + timedelta(days=days_ahead)
        # Advance until we hit the target weekday
        while candidate.weekday() != weekday_offset:
            days_ahead += 1
            candidate = now + timedelta(days=days_ahead)
        return days_ahead

    def create_modules(self):
        """Creates KCL modules seeded by admin user. Lectures only on weekdays."""
        self.stdout.write("Seeding modules...")
        admin = User.objects.filter(is_superuser=True).first()
        weekly_rule = RecurrenceRule.objects.filter(frequency='weekly', interval=1).first()

        for code, name, description in module_fixtures:
            if Module.objects.filter(module_code=code).exists():
                continue

            # Pick a random weekday (Mon=0 to Fri=4)
            weekday = random.randint(0, 4)
            day_offset = self.get_next_weekday(weekday)

            hour = random.choice([9, 10, 11, 14, 15, 16])
            start_time = timezone.now().replace(
                hour=hour, minute=0, second=0, microsecond=0
            ) + timedelta(days=day_offset)
            end_time = start_time + timedelta(hours=2)

            Module.objects.create(
                module_code=code,
                module_name=name,
                description=description,
                created_by=admin,
                start_time=start_time,
                end_time=end_time,
                location=random.choice(lecture_theatre_fixtures),
                recurrence_rule=weekly_rule,
            )

    def create_enrollments(self):
        """Enrolls each user in modules relevant to their course and creates lecture calendar events."""
        self.stdout.write("Seeding enrollments and lecture events...")
        enrollments_to_create = []
        lecture_tag = next((t for t in self.tags if t.name == 'Lecture'), None)
        users_with_settings = User.objects.all().select_related('settings')

        for user in users_with_settings:
            major = user.settings.major if hasattr(user, 'settings') and user.settings else None
            prefixes = course_to_module_prefixes.get(major, [])
            relevant_modules = [m for m in self.modules if any(m.module_code.startswith(p) for p in prefixes)]

            if not prefixes or len(relevant_modules) == 0:
                relevant_modules = random.sample(self.modules, min(4, len(self.modules)))

            for module in relevant_modules:
                if not Enrollment.objects.filter(student=user, module=module).exists():
                    enrollments_to_create.append(Enrollment(student=user, module=module))

                for week in range(10):
                    lecture_start = module.start_time + timedelta(weeks=week)
                    lecture_end = lecture_start + timedelta(hours=2)
                    CalendarEvent.objects.get_or_create(
                        user=user,
                        title=f"Lecture: {module.module_name}",
                        start_time=lecture_start,
                        defaults={
                            'end_time': lecture_end,
                            'location': module.location,
                            'description': module.module_name,
                            'tag': lecture_tag,
                            'priority': 'high',
                        }
                    )

        Enrollment.objects.bulk_create(enrollments_to_create, ignore_conflicts=True)
        self.stdout.write(f"Created {len(enrollments_to_create)} enrollments.")

    def create_deadlines(self):
        """ Creates deadlines relevant for each seeded module."""
        self.stdout.write("Seeding deadlines...")
        deadlines_to_create = []
        now = timezone.now()

        for module in self.modules:
            prefix = module.module_code[:2]
            templates = module_deadline_fixtures.get(prefix, list(deadline_fixtures[:3]))
            used_offsets = set()
            for deadline_type, title, description in templates:
                while True:
                    day_offset = random.randint(7,30)
                    if day_offset not in used_offsets:
                        used_offsets.add(day_offset)
                        break
                
                hour = 23 if deadline_type in ("coursework", "quiz") else random.choice([9, 11, 14, 16])
                start_due = now.replace(
                hour=hour, minute=0, second=0, microsecond=0
            ) + timedelta(days=day_offset)
                
            end_due = None
            if deadline_type in ("exam", "presentation"):
                end_due = start_due + timedelta(hours=2)
            location = None
            if deadline_type in ("exam", "presentation"): 
                location = random.choice(lecture_theatre_fixtures)

            if not Deadline.objects.filter(module=module, title=title).exists():
                    deadlines_to_create.append(Deadline(
                        module=module,
                        title=title,
                        deadline_type=deadline_type,
                        description=description,
                        start_due_date=start_due,
                        end_due_date=end_due,
                        location=location,
                    ))
        Deadline.objects.bulk_create(deadlines_to_create, ignore_conflicts=True)
        self.stdout.write(f"Created {len(deadlines_to_create)} deadlines across {len(self.modules)} modules.")
    
    def create_deadline_calendar_event(self, user, deadline):
        """Creates a calendar event for a single deadline."""
        CalendarEvent.objects.get_or_create(
            user=user,
            title=f"{deadline.deadline_type.capitalize()}: {deadline.title}",
            start_time=deadline.start_due_date,
            defaults={
                'end_time': deadline.end_due_date or deadline.start_due_date,
                'location': deadline.location,
                'description': deadline.description,
                'priority': 'high',
            }
        ) 
    
    def print_stats(self):
        print("=" * 30)
        print(f"Users: {User.objects.count()}")
        print(f"Modules: {Module.objects.count()}")
        print(f"Enrollments: {Enrollment.objects.count()}")
        print(f"Categories: {Category.objects.count()}")
        print(f"Tags: {Tag.objects.count()}")
        print(f"Events: {CalendarEvent.objects.count()}")
        print("=" * 30)