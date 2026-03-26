"""
Tests for seeded teacher tasks.
"""

from django.test import TestCase
from django.utils import timezone

from studyFlax.management.commands.seed_helpers.tasks.tasks import _seed_tasks_for_user
from studyFlax.models.tasks.task_model import Task
from studyFlax.tests.helpers.test_model_builders import make_user


class SeedTeacherTasksTests(TestCase):
    """Tests seed teacher tasks."""
    def test_teacher_seed_keeps_completed_tasks_for_homepage_widgets(self):
        user = make_user("amiller_seed")
        user.role = "teacher"
        user.save(update_fields=["role"])

        _seed_tasks_for_user(user, timezone.now())

        completed_tasks = Task.objects.filter(user=user, completed=True)

        self.assertTrue(completed_tasks.exists())
        self.assertTrue(completed_tasks.filter(completed_at__isnull=False).exists())
        self.assertTrue(completed_tasks.filter(due_date__date=timezone.localdate()).exists())
