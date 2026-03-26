"""
Management command entry point for group project seeding.
"""

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Seed group project data for development."""

    help = "Seed group projects and memberships"

    def handle(self, *args, **options):
        """Report that the standalone group seeding command is not implemented."""

        self.stdout.write("Group seeding not yet implemented.")
