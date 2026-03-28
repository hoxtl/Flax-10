"""
Management command entry point for society seeding.
"""

from django.core.management.base import BaseCommand

from studyFlax.management.commands.seed_helpers.societies.societies import (
    create_societies,
    create_society_announcements,
    create_society_events,
    create_society_images,
    create_society_memberships,
)


class Command(BaseCommand):
    """Seed society data for development."""

    help = "Seed societies and memberships"

    def handle(self, *args, **options):
        create_societies(self.stdout)
        create_society_memberships(self.stdout)
        create_society_events(self.stdout)
        create_society_images(self.stdout)
        create_society_announcements(self.stdout)
        self.stdout.write(self.style.SUCCESS("Society seeding complete."))
