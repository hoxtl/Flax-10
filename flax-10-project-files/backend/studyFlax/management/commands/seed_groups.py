"""
Management command entry point for group project seeding.
"""

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Seed group project data for development."""

    help = "Seed group projects and memberships"

    def handle(self, *args, **options):
        self.stdout.write("Group seeding not yet implemented.")
