"""
Management command for seeding society data.
"""

from django.core.management.base import BaseCommand

from studyFlax.models.society.society_calendar_sync_model import SocietyCalendarSync
from studyFlax.models.society.society_membership_model import SocietyMembership


def _ensure_seed_membership(user, society, role):
    """Create or update a society membership with notifications and calendar sync enabled."""

    membership, _ = SocietyMembership.objects.update_or_create(
        user=user,
        society=society,
        defaults={"role": role, "is_subscribed": True},
    )
    SocietyCalendarSync.objects.get_or_create(user=user, society=society)
    return membership


class Command(BaseCommand):
    """Seed society data for development."""

    help = "Seed societies and memberships"

    def handle(self, *args, **options):
        self.stdout.write("Society seeding not yet implemented.")
