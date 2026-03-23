"""
Orchestrates creation of societies, memberships, events and images.
"""

import random
from datetime import date, timedelta

SOCIETY_RECURRENCE_END = date(2026, 6, 30)

from django.contrib.auth import get_user_model

from studyFlax.models import (
    Society, SocietyMembership, SocietyTag, SocietyEvent, SocietyImage, SocietyCalendarSync,
)
from studyFlax.fixtures.data_fixtures import location_fixtures
from studyFlax.fixtures.society_fixtures import build_society_seed_data, build_event_datetime

User = get_user_model()

PENDING_RATIFICATION_TARGET = 14
APPROVED_SOCIETY_TARGET = 24

def _society_status_for_index(index, total):
    pending_target = min(PENDING_RATIFICATION_TARGET, max(total // 5, 1))
    approved_target = min(APPROVED_SOCIETY_TARGET, max(total - pending_target, 0))
    if index < pending_target:
        return 'pending'
    if index < pending_target + approved_target:
        return 'approved'
    return 'rejected' if (index - pending_target - approved_target) % 2 == 0 else 'none'

def _create_society_from_config(data, index, total):
    status = _society_status_for_index(index, total)
    defaults = {
        'bio': data['bio'], 'about': data['about'],
        'categories': data.get('categories', []),
        'ratification_status': status, 'is_ratified': (status == 'approved'),
    }
    if data.get('image'):
        defaults['image'] = data['image']
    society, _ = Society.objects.update_or_create(name=data['name'], defaults=defaults)
    return society

PASTEL_TAG_COLORS = [
    '#F4A7B9', '#B8C8F4', '#A8D8B0', '#F9C89A', '#C5B4E3',
    '#96CEFF', '#F7D090', '#B0D9A8', '#F2C6D0', '#9FD3D3',
    '#D4B5C8', '#C8E6C9', '#FFD1A8', '#E1BEE7', '#B3E5FC',
    '#F0F4C3', '#DCEDC8', '#FFDDB3', '#E8EAF6', '#FCE4EC',
    '#C9E4CA', '#FFE4B5', '#D0E8FF', '#FFD6E0', '#D6EAD0',
]

def _tag_color_for_label(label):
    return PASTEL_TAG_COLORS[sum(ord(c) for c in label) % len(PASTEL_TAG_COLORS)]

def _seed_society_tags(society, tag_labels):
    for label in tag_labels:
        SocietyTag.objects.update_or_create(
            society=society, label=label,
            defaults={'color': _tag_color_for_label(label)},
        )

def create_societies(stdout):
    seed_data = build_society_seed_data()
    total = len(seed_data)
    for index, data in enumerate(seed_data):
        society = _create_society_from_config(data, index, total)
        _seed_society_tags(society, data.get('tags', []))

def _build_event_defaults(desc, start, end, recurrence, tags):
    return {
        'description': desc, 'location': random.choice(location_fixtures),
        'start_time': start, 'end_time': end,
        'recurrence': recurrence or 'none',
        'recurrence_end_date': SOCIETY_RECURRENCE_END if recurrence else None,
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
    for society in Society.objects.all():
        _set_cover_image(society)
        _add_extra_images(society)

def _pick_admin(admin_counts, student_users):
    eligible = [u for u in student_users if admin_counts[u.id] < 3]
    return random.choice(eligible) if eligible else None

MAX_SYNC_PER_USER = 2

def _ensure_seed_membership(user, society, role, sync_counts):
    sync_count = sync_counts.get(user.id, 0)
    enable_sync = sync_count < MAX_SYNC_PER_USER
    membership, _ = SocietyMembership.objects.update_or_create(
        user=user,
        society=society,
        defaults={'role': role, 'is_subscribed': enable_sync},
    )
    if enable_sync:
        SocietyCalendarSync.objects.get_or_create(user=user, society=society)
        sync_counts[user.id] = sync_count + 1
    return membership

def _add_admin_membership(society, admin, admin_counts, sync_counts):
    _ensure_seed_membership(admin, society, 'admin', sync_counts)
    society.admin_emails = admin.email
    society.save()
    admin_counts[admin.id] += 1

def _seed_regular_members(society, admin, member_counts, student_users, sync_counts):
    eligible = [u for u in student_users if u.id != admin.id and member_counts[u.id] < 5]
    count = min(random.randint(5, 15), len(eligible))
    members = random.sample(eligible, count)
    for member in members:
        _ensure_seed_membership(member, society, 'member', sync_counts)
        member_counts[member.id] += 1

def _seed_society_members(society, admin_counts, member_counts, student_users, sync_counts):
    admin = _pick_admin(admin_counts, student_users)
    if not admin:
        return
    _add_admin_membership(society, admin, admin_counts, sync_counts)
    _seed_regular_members(society, admin, member_counts, student_users, sync_counts)

def create_society_memberships(stdout):
    SocietyMembership.objects.filter(user__role='teacher').delete()
    student_users = list(User.objects.filter(role='student'))
    admin_counts = {u.id: 0 for u in student_users}
    member_counts = {u.id: 0 for u in student_users}
    sync_counts = {u.id: 0 for u in student_users}
    for society in Society.objects.all():
        _seed_society_members(society, admin_counts, member_counts, student_users, sync_counts)
