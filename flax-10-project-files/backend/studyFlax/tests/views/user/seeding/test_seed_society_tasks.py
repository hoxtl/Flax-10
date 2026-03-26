"""
Tests for seeded society tasks.
"""

from django.test import TestCase
from django.utils import timezone

from studyFlax.management.commands.seed_helpers.tasks.tasks import (
    SEEDED_TASK_DUE_HOUR,
    SEEDED_TASK_DUE_MINUTE,
    seed_society_tasks_for_user,
)
from studyFlax.models.tasks.task_model import Task, TaskList
from studyFlax.tests.helpers.test_model_builders import (
    make_society,
    make_society_admin,
    make_society_member,
    make_user,
)


class SeedSocietyTasksTests(TestCase):
    """Tests seed society tasks."""

    def test_seeds_society_lists_and_tasks_for_admin_memberships(self):
        user = make_user("soc_admin_seed", "soc_admin_seed@example.com")
        society = make_society("Chess Society")
        make_society_admin(user, society)

        created = seed_society_tasks_for_user(user, timezone.now())

        self.assertGreater(created, 0)
        task_list = TaskList.objects.get(user=user, society=society)
        self.assertEqual(task_list.category, "society")
        task = Task.objects.filter(user=user, task_list=task_list).first()
        self.assertIsNotNone(task)
        self.assertEqual(task.due_date.hour, SEEDED_TASK_DUE_HOUR)
        self.assertEqual(task.due_date.minute, SEEDED_TASK_DUE_MINUTE)

    def test_does_not_seed_society_tasks_for_regular_members(self):
        user = make_user("soc_member_seed", "soc_member_seed@example.com")
        society = make_society("Debate Society")
        make_society_member(user, society)

        created = seed_society_tasks_for_user(user, timezone.now())

        self.assertEqual(created, 0)
        self.assertFalse(TaskList.objects.filter(user=user, society=society).exists())
