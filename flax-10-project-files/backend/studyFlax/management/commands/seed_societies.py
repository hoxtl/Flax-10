"""
Orchestrates creation of societies, memberships, events and images.
"""

import random
from datetime import timedelta

from django.contrib.auth import get_user_model

from studyFlax.models import (
    Society, SocietyMembership, SocietyTag, SocietyEvent, SocietyImage,
)
from studyFlax.fixtures.data_fixtures import location_fixtures
from studyFlax.fixtures.society_fixtures import build_society_seed_data, build_event_datetime

User = get_user_model()

def _create_society_from_config(data):
    status = random.choice(['approved', 'pending', 'rejected', 'none'])
    defaults = {
        'bio': data['bio'], 'about': data['about'],
        'categories': data.get('categories', []),
        'ratification_status': status, 'is_ratified': (status == 'approved'),
    }
    if data.get('image'):
        defaults['image'] = data['image']
    society, _ = Society.objects.update_or_create(name=data['name'], defaults=defaults)
    return society

def _seed_society_tags(society, tag_labels):
    from faker import Faker
    f = Faker('en_GB')
    for label in tag_labels:
        SocietyTag.objects.get_or_create(society=society, label=label, defaults={'color': f.hex_color()})

def create_societies(stdout):
    stdout.write("Seeding societies...")
    for data in build_society_seed_data():
        society = _create_society_from_config(data)
        _seed_society_tags(society, data.get('tags', []))

def _build_event_defaults(desc, start, end, recurrence, tags):
    return {
        'description': desc, 'location': random.choice(location_fixtures),
        'start_time': start, 'end_time': end,
        'recurrence': recurrence or 'none',
        'recurrence_end_date': (start + timedelta(days=90)).date() if recurrence else None,
        'tag': random.choice(tags) if tags else None,
    }

def _create_event_from_template(society, template, tags):
    title, desc, hour, duration, recurrence, day = template
    start, end = build_event_datetime(hour, duration, day)
    SocietyEvent.objects.get_or_create(
        society=society, title=title,
        defaults=_build_event_defaults(desc, start, end, recurrence, tags),
    )

def _seed_events_for_society(society):
    config = next((s for s in build_society_seed_data() if s['name'] == society.name), None)
    if not config:
        return
    tags = list(society.tags.all())
    for event_template in config.get('events', []):
        _create_event_from_template(society, event_template, tags)

def create_society_events(stdout):
    stdout.write("Seeding society events...")
    for society in Society.objects.all():
        _seed_events_for_society(society)

def _set_cover_image(society):
    if not society.image:
        return
    SocietyImage.objects.filter(society=society, is_cover=True).delete()
    SocietyImage.objects.create(society=society, is_cover=True, url=society.image)

def _add_extra_images(society):
    current_count = society.images.count()
    for i in range(5 - current_count):
        SocietyImage.objects.create(
            society=society,
            url=f"https://picsum.photos/seed/{society.name}{i}/800/600",
            is_cover=False,
        )

def create_society_images(stdout):
    stdout.write("Seeding society images...")
    for society in Society.objects.all():
        _set_cover_image(society)
        _add_extra_images(society)

def _pick_admin(admin_counts, student_users):
    eligible = [u for u in student_users if admin_counts[u.id] < 3]
    return random.choice(eligible) if eligible else None

def _add_admin_membership(society, admin, admin_counts):
    SocietyMembership.objects.get_or_create(
        user=admin, society=society, defaults={'role': 'admin'},
    )
    society.admin_emails = admin.email
    society.save()
    admin_counts[admin.id] += 1

def _seed_regular_members(society, admin, member_counts, student_users):
    eligible = [u for u in student_users if u.id != admin.id and member_counts[u.id] < 5]
    count = min(random.randint(5, 15), len(eligible))
    members = random.sample(eligible, count)
    for member in members:
        SocietyMembership.objects.get_or_create(
            user=member, society=society, defaults={'role': 'member'},
        )
        member_counts[member.id] += 1

def _seed_society_members(society, admin_counts, member_counts, student_users):
    admin = _pick_admin(admin_counts, student_users)
    if not admin:
        return
    _add_admin_membership(society, admin, admin_counts)
    _seed_regular_members(society, admin, member_counts, student_users)

def create_society_memberships(stdout):
    stdout.write("Seeding society memberships...")
    SocietyMembership.objects.filter(user__role='teacher').delete()
    student_users = list(User.objects.filter(role='student'))
    admin_counts = {u.id: 0 for u in student_users}
    member_counts = {u.id: 0 for u in student_users}
    for society in Society.objects.all():
        _seed_society_members(society, admin_counts, member_counts, student_users)
