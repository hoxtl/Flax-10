"""
Management command for seeding group project data.
"""

from django.core.management.base import BaseCommand


def _build_completed_task_assignments(members, statuses):
    """Return a mapping of done-task index to members assigned to mark it complete."""

    done_indices = [i for i, status in enumerate(statuses) if status == "done"]
    if not done_indices:
        return {}
    assignments = {i: [] for i in done_indices}
    for j, member in enumerate(members):
        assignments[done_indices[j % len(done_indices)]].append(member)
    return assignments


class Command(BaseCommand):
    """Seed group project data for development."""

    help = "Seed group projects and memberships"

    def handle(self, *args, **options):
        self.stdout.write("Group seeding not yet implemented.")
