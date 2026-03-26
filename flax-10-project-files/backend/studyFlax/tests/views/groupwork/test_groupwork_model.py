"""
Tests for groupwork model strings.
"""

from datetime import timedelta

from django.utils import timezone

from studyFlax.models.groupwork.groupwork_model import (
    GroupProject,
    MeetingResponse,
    MeetingSuggestion,
)
from studyFlax.tests.helpers.test_case_support import BaseTestCase


class GroupworkModelStrTests(BaseTestCase):
    """Tests groupwork model str."""
    def test_group_project_str(self):
        project = GroupProject.objects.create(name="My Project", owner=self.user)
        self.assertEqual(str(project), "My Project")

    def test_meeting_suggestion_str(self):
        project = GroupProject.objects.create(name="Proj", owner=self.user)
        now = timezone.now()
        suggestion = MeetingSuggestion.objects.create(
            project=project, suggested_by=self.user, start_time=now, end_time=now + timedelta(hours=1)
        )
        self.assertIn("Proj", str(suggestion))
        self.assertIn(str(now), str(suggestion))

    def test_meeting_response_str(self):
        project = GroupProject.objects.create(name="Proj", owner=self.user)
        now = timezone.now()
        suggestion = MeetingSuggestion.objects.create(
            project=project, suggested_by=self.user, start_time=now, end_time=now + timedelta(hours=1)
        )
        response = MeetingResponse.objects.create(
            suggestion=suggestion, user=self.user, status="accepted"
        )
        result = str(response)
        self.assertIn("accepted", result)
        self.assertIn(self.user.username, result)
