"""
Tests for groupwork models.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from studyFlax.models.groupwork.groupwork_model import GroupProject, GroupMembership, MeetingSuggestion, MeetingResponse
from django.utils import timezone
from datetime import timedelta


User = get_user_model()

class GroupWorkModelTest(TestCase):
    """Tests group work model."""
    def setUp(self):
        self.user1 = User.objects.create_user(username="u1", email="u1@e.com", password="p")
        self.user2 = User.objects.create_user(username="u2", email="u2@e.com", password="p")

    def test_group_project_creation(self):
        project = GroupProject.objects.create(
            name="Test Project",
            owner=self.user1,
            course_code="CS101"
        )
        self.assertEqual(project.name, "Test Project")
        self.assertEqual(project.owner, self.user1)
        self.assertEqual(project.course_code, "CS101")

    def test_group_membership_creation(self):
        project = GroupProject.objects.create(name="P1", owner=self.user1)
        membership = GroupMembership.objects.create(
            project=project,
            user=self.user2,
            role="member"
        )
        self.assertEqual(membership.project, project)
        self.assertEqual(membership.user, self.user2)
        self.assertEqual(membership.role, "member")

    def test_meeting_suggestion_creation(self):
        project = GroupProject.objects.create(name="P1", owner=self.user1)
        start = timezone.now() + timedelta(days=1)
        end = start + timedelta(hours=1)
        suggestion = MeetingSuggestion.objects.create(
            project=project,
            suggested_by=self.user1,
            start_time=start,
            end_time=end
        )
        self.assertEqual(suggestion.project, project)
        self.assertEqual(suggestion.suggested_by, self.user1)
        self.assertEqual(suggestion.start_time, start)

    def test_meeting_response_creation(self):
        project = GroupProject.objects.create(name="P1", owner=self.user1)
        suggestion = MeetingSuggestion.objects.create(
            project=project,
            suggested_by=self.user1,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1)
        )
        response = MeetingResponse.objects.create(
            suggestion=suggestion,
            user=self.user2,
            status="accepted"
        )
        self.assertEqual(response.suggestion, suggestion)
        self.assertEqual(response.user, self.user2)
        self.assertEqual(response.status, "accepted")
