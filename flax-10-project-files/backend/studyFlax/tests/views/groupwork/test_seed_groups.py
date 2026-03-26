"""Tests for completed group task assignment helpers."""

import random
from types import SimpleNamespace

from django.test import SimpleTestCase

from studyFlax.management.commands.seed_helpers.groupwork.tasks import _build_completed_task_assignments


class SeedGroupTaskAssignmentsTest(SimpleTestCase):
    def test_completed_task_assignments_cover_every_member(self):
        members = [
            SimpleNamespace(username=f"member_{index}")
            for index in range(10)
        ]

        assignments = _build_completed_task_assignments(
            members,
            ("done", "todo", "done", "in_progress", "todo"),
            random.Random("seed-groups-test"),
        )

        assigned_usernames = {
            member.username
            for assignees in assignments.values()
            for member in assignees
        }

        self.assertEqual(set(assignments.keys()), {0, 2})
        self.assertEqual(assigned_usernames, {member.username for member in members})

    def test_completed_task_assignments_return_empty_when_project_has_no_done_tasks(self):
        members = [SimpleNamespace(username="member_1"), SimpleNamespace(username="member_2")]

        assignments = _build_completed_task_assignments(
            members,
            ("todo", "in_progress", "todo", "todo", "todo"),
            random.Random("seed-groups-empty"),
        )

        self.assertEqual(assignments, {})
