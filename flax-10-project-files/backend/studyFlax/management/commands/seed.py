import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent, 
    UserSettings, Module, Enrollment,
    Society, SocietyMembership, SocietyTag, SocietyEvent, SocietyImage
)
from studyFlax.fixtures.data_fixtures import (
    category_fixtures, tag_fixtures, recurrence_fixtures, 
    module_fixtures, society_fixtures, location_fixtures
)
from .seed_helpers import (
    build_users_list, build_settings_for_new_users, build_events_for_user,
    build_module_event, get_user_modules, build_lecture_events, create_lecture_event
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with structured data based on fixtures and Faker.'
    USER_COUNT = 25
    EVENTS_PER_USER_RANGE = (60, 90)
    DEFAULT_PASSWORD = '1234'

    def _load_shared_data(self):
        self.users = list(User.objects.filter(is_staff=False))
        self.categories = list(Category.objects.all())
        self.tags = list(Tag.objects.all())
        self.rules = list(RecurrenceRule.objects.all())
        self.modules = list(Module.objects.all())

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting seeding process...'))
        self.create_admin_user()
        self.create_random_users()
        self.users = list(User.objects.filter(is_staff=False))
        self.create_recurrence_rules()
        self.create_categories()
        self.categories = list(Category.objects.all()) 
        self.create_tags()
        self._load_shared_data()
        self.create_events_for_users()
        self.create_modules()
        self.modules = list(Module.objects.all())
        self.create_enrollments()
        self.create_societies()
        self.create_society_memberships()
        self.create_society_events()
        self.create_society_images()
        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
        self.print_stats()  

    def create_admin_user(self):
        if User.objects.filter(username='johndoe').exists():
            return
        User.objects.create_superuser(username='johndoe', email='john.doe@example.com',
                                      password=self.DEFAULT_PASSWORD, first_name='John', last_name='Doe')
        self.stdout.write(self.style.SUCCESS("Created admin user: johndoe"))

    def create_random_users(self):
        needed = self.USER_COUNT - User.objects.count()
        if needed <= 0:
            self.stdout.write("Enough users already exist.")
            return
        self.stdout.write(f"Seeding {needed} users...")
        User.objects.bulk_create(build_users_list(needed), ignore_conflicts=True)
        UserSettings.objects.bulk_create(build_settings_for_new_users())

    def create_recurrence_rules(self):
        self.stdout.write("Seeding recurrence rules...")
        for freq, interval in recurrence_fixtures:
            RecurrenceRule.objects.get_or_create(frequency=freq, interval=interval)

    def create_categories(self):
        self.stdout.write("Seeding categories...")
        for name, color, is_default in category_fixtures:
            user = random.choice(self.users) if not is_default and self.users and random.random() > 0.7 else None
            Category.objects.get_or_create(name=name, user=user, defaults={'color': color, 'is_default': is_default})

    def create_tags(self):
        self.stdout.write("Seeding tags...")
        from faker import Faker
        f = Faker('en_GB')
        for name, duration in tag_fixtures:
            category = random.choice(self.categories) if self.categories and random.random() > 0.3 else None
            user = category.user if category and category.user else (random.choice(self.users) if self.users and random.random() > 0.7 else None)
            Tag.objects.get_or_create(name=name, user=user, defaults={'category': category, 'default_duration': duration, 'color': f.hex_color()})

    def create_events_for_users(self):
        self.stdout.write("Seeding events for users...")
        total = 0
        for i, user in enumerate(self.users):
            print(f"Processing user {i+1}/{len(self.users)}: {user.username}", end='\r')
            from faker import Faker
            count = Faker('en_GB').random_int(*self.EVENTS_PER_USER_RANGE)
            events = build_events_for_user(user, self.tags, self.rules, count)
            CalendarEvent.objects.bulk_create(events)
            total += len(events)
        print(f"\nCreated {total} events across {len(self.users)} users.")

    def _create_module(self, code, name, description, admin, weekly_rule):
        if not Module.objects.filter(module_code=code).exists():
            Module.objects.create(**build_module_event(code, name, description, admin, weekly_rule))

    def create_modules(self):
        self.stdout.write("Seeding modules...")
        admin = User.objects.filter(is_superuser=True).first()
        weekly_rule = RecurrenceRule.objects.filter(frequency='weekly', interval=1).first()
        for code, name, description in module_fixtures:
            self._create_module(code, name, description, admin, weekly_rule)

    def _should_enroll(self, user, module):
        return not Enrollment.objects.filter(student=user, module=module).exists()

    def _enroll_if_needed(self, user, module, enrollments):
        if self._should_enroll(user, module):
            enrollments.append(Enrollment(student=user, module=module))

    def _process_module(self, user, module, lecture_tag, enrollments):
        self._enroll_if_needed(user, module, enrollments)
        for u, mod, start, end, tag in build_lecture_events(user, module, lecture_tag):
            create_lecture_event(u, mod, start, end, tag)

    def _process_user_modules(self, user, lecture_tag, enrollments):
        for module in get_user_modules(user, self.modules):
            self._process_module(user, module, lecture_tag, enrollments)

    def create_enrollments(self):
        self.stdout.write("Seeding enrollments and lecture events...")
        lecture_tag = next((t for t in self.tags if t.name == 'Lecture'), None)
        enrollments = []
        for user in User.objects.all().select_related('settings'):
            self._process_user_modules(user, lecture_tag, enrollments)
        Enrollment.objects.bulk_create(enrollments, ignore_conflicts=True)
        self.stdout.write(f"Created {len(enrollments)} enrollments.")

    def create_societies(self):
        self.stdout.write("Seeding societies...")
        for name, bio, about, image in society_fixtures:
            status = random.choice(['approved', 'pending', 'rejected', 'none'])
            society, _ = Society.objects.update_or_create(
                name=name,
                defaults={
                    'bio': bio, 'about': about, 'image': image,
                    'ratification_status': status, 'is_ratified': (status == 'approved')
                }
            )
            self._seed_society_tags(society)

    def _seed_images_for_society(self, society):
        if society.image:
            SocietyImage.objects.filter(society=society, is_cover=True).delete()
            SocietyImage.objects.create(
                society=society, is_cover=True, url=society.image
            )
        current_count = society.images.count()
        if current_count < 5:
            from faker import Faker
            f = Faker('en_GB')
            for _ in range(5 - current_count):
                SocietyImage.objects.create(
                    society=society,
                    url=f"https://picsum.photos/seed/{society.name}{_}/800/600",
                    is_cover=False
                )

    def _seed_events_for_society(self, society):
        from faker import Faker
        f = Faker('en_GB')
        tags = list(society.tags.all())
        for _ in range(random.randint(2, 5)):
            start = timezone.make_aware(f.date_time_between(start_date='-1M', end_date='+2M'))
            SocietyEvent.objects.create(
                society=society,
                title=f.catch_phrase(),
                description=f.bs().capitalize() + ".",
                location=random.choice(location_fixtures),
                start_time=start,
                end_time=start + timedelta(minutes=random.choice([60, 90, 120])),
                tag=random.choice(tags) if tags else None
            )

    def _seed_society_tags(self, society):
        from faker import Faker
        f = Faker('en_GB')
        tags = ["Social", "Academic", "Career", "Hobbies", "Sports"]
        for label in random.sample(tags, random.randint(1, 3)):
            SocietyTag.objects.get_or_create(
                society=society, label=label,
                defaults={'color': f.hex_color()}
            )

    def create_society_memberships(self):
        self.stdout.write("Seeding society memberships...")
        for society in Society.objects.all():
            self._seed_society_members(society)

    def _seed_society_members(self, society):
        admin = random.choice(self.users)
        SocietyMembership.objects.get_or_create(
            user=admin, society=society, defaults={'role': 'admin'}
        )
        members = random.sample(self.users, random.randint(5, 15))
        for member in members:
            SocietyMembership.objects.get_or_create(
                user=member, society=society, defaults={'role': 'member'}
            )

    def create_society_events(self):
        self.stdout.write("Seeding society events...")
        for society in Society.objects.all():
            self._seed_events_for_society(society)

    def create_society_images(self):
        self.stdout.write("Seeding society images...")
        for society in Society.objects.all():
            self._seed_images_for_society(society)

    def print_stats(self):
        print("=" * 30)
        print(f"Users: {User.objects.count()}")
        print(f"Modules: {Module.objects.count()}")
        print(f"Enrollments: {Enrollment.objects.count()}")
        print(f"Categories: {Category.objects.count()}")
        print(f"Tags: {Tag.objects.count()}")
        print(f"Events: {CalendarEvent.objects.count()}")
        print(f"Societies: {Society.objects.count()}")
        print(f"Society Memberships: {SocietyMembership.objects.count()}")
        print(f"Society Events: {SocietyEvent.objects.count()}")
        print(f"Society Images: {SocietyImage.objects.count()}")
        print("=" * 30)