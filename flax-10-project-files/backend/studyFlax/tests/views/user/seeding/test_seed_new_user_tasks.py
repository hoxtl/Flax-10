"""
Tests for seeded new-user tasks.
"""

from datetime import datetime

from django.test import TestCase
from django.utils import timezone

from studyFlax.management.commands.seed_helpers.tasks.tasks import (
    SEEDED_TASK_DUE_HOUR,
    SEEDED_TASK_DUE_MINUTE,
    seed_new_user_tasks,
)
from studyFlax.models import Enrollment
from studyFlax.models.tasks.task_model import Task
from studyFlax.tests.helpers.test_model_builders import make_module, make_user


class SeedNewUserTasksTests(TestCase):
    """Tests seed new user tasks."""

    def test_due_today_task_uses_evening_seed_time_instead_of_11pm(self):
        user = make_user("new_user_seed", "new_user_seed@example.com")
        teacher = make_user("seed_teacher_owner", "seed_teacher_owner@example.com")
        module = make_module("CS1234", "Algorithms", teacher)
        Enrollment.objects.create(student=user, module=module)
        now = timezone.make_aware(datetime(2026, 3, 25, 9, 0))

        created = seed_new_user_tasks(user, now)

        self.assertGreater(created, 0)
        due_today = Task.objects.filter(user=user, due_date__date=timezone.localdate(now)).order_by("due_date").first()
        self.assertIsNotNone(due_today)
        self.assertEqual(due_today.due_date.hour, SEEDED_TASK_DUE_HOUR)
        self.assertEqual(due_today.due_date.minute, SEEDED_TASK_DUE_MINUTE)
