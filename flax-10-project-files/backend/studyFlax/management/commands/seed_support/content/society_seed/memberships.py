"""
Membership seeding for society records.
"""

import random

from django.contrib.auth import get_user_model

from studyFlax.models import Society, SocietyCalendarSync, SocietyMembership

User = get_user_model()

MAX_SYNC_PER_USER = 2


def _pick_admin(admin_counts, student_users):
    eligible = [user for user in student_users if admin_counts[user.id] < 3]
    return random.choice(eligible) if eligible else None


def _ensure_sync(user, society, enable_sync):
    if not enable_sync:
        return
    SocietyCalendarSync.objects.get_or_create(user=user, society=society)


def _ensure_seed_membership(user, society, role, sync_counts=None):
    """Create or update one seeded society membership."""

    sync_counts = sync_counts or {}
    sync_count = sync_counts.get(user.id, 0)
    enable_sync = sync_count < MAX_SYNC_PER_USER
    membership, _ = SocietyMembership.objects.update_or_create(
        user=user,
        society=society,
        defaults={"role": role, "is_subscribed": enable_sync},
    )
    _ensure_sync(user, society, enable_sync)
    if enable_sync:
        sync_counts[user.id] = sync_count + 1
    return membership


def _add_admin_membership(society, admin, admin_counts, sync_counts):
    _ensure_seed_membership(admin, society, "admin", sync_counts)
    society.admin_emails = admin.email
    society.save(update_fields=["admin_emails"])
    admin_counts[admin.id] += 1


def _seed_regular_members(society, admin, member_counts, student_users, sync_counts):
    eligible = [user for user in student_users if user.id != admin.id and member_counts[user.id] < 5]
    member_total = min(random.randint(5, 15), len(eligible))
    for member in random.sample(eligible, member_total):
        _ensure_seed_membership(member, society, "member", sync_counts)
        member_counts[member.id] += 1


def _seed_society_members(society, admin_counts, member_counts, student_users, sync_counts):
    admin = _pick_admin(admin_counts, student_users)
    if not admin:
        return
    _add_admin_membership(society, admin, admin_counts, sync_counts)
    _seed_regular_members(society, admin, member_counts, student_users, sync_counts)


def create_society_memberships(stdout):
    """Create seeded society memberships and limited calendar syncs."""

    del stdout
    SocietyMembership.objects.filter(user__role="teacher").delete()
    student_users = list(User.objects.filter(role="student"))
    admin_counts = {user.id: 0 for user in student_users}
    member_counts = {user.id: 0 for user in student_users}
    sync_counts = {user.id: 0 for user in student_users}
    for society in Society.objects.all():
        _seed_society_members(society, admin_counts, member_counts, student_users, sync_counts)

