"""
Society task seeding helpers.
"""

from django.utils import timezone

from studyFlax.models import SocietyMembership
from studyFlax.models.tasks.task_model import Task
from .lists import build_due_date, ensure_society_task_list


SOCIETY_TASK_FIXTURES = (
    ("Plan the next {society} committee agenda", "Set priorities for the next committee meeting, confirm owners, and keep the society plan moving.", "high", 2, 1),
    ("Publish this week's {society} update", "Draft a clear post for members covering the next event, reminders, and anything that needs sign-off.", "medium", 1, 2),
    ("Review new {society} member requests", "Check recent joins, answer any questions, and make sure new members know what is happening next.", "medium", 1, 4),
    ("Update the {society} event checklist", "Check venue, timings, and promotion details so the next session runs smoothly.", "low", 1, 6),
)


def _seed_society_task_list(user, society, task_list, now):
    if Task.objects.filter(user=user, task_list=task_list).exists():
        return 0
    count = 0
    for title_template, description_template, priority, blocks, days in SOCIETY_TASK_FIXTURES:
        Task.objects.create(
            user=user,
            task_list=task_list,
            title=title_template.format(society=society.name),
            description=description_template.format(society=society.name),
            priority=priority,
            due_date=build_due_date(now, days),
            estimated_blocks=blocks,
            completed=False,
        )
        count += 1
    return count

def seed_society_tasks_for_user(user, now):
    memberships = list(SocietyMembership.objects.filter(user=user, role__in=["admin", "editor"]).select_related("society"))
    total = 0
    for membership in memberships:
        task_list = ensure_society_task_list(user, membership.society)
        total += _seed_society_task_list(user, membership.society, task_list, now)
    return total

def create_society_tasks(stdout):
    """Seed society admin task lists across all eligible users."""
    now = timezone.now()
    memberships = SocietyMembership.objects.filter(role__in=["admin", "editor"]).select_related("user")
    users = {membership.user_id: membership.user for membership in memberships}
    total = sum(seed_society_tasks_for_user(user, now) for user in users.values())
    stdout.write(f"  \u2713  {'Society tasks':<14} {total:,}")

