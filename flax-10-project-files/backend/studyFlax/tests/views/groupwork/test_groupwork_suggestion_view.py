from datetime import timedelta

from django.utils import timezone
from rest_framework import status

from studyFlax.models.groupwork.groupworkModel import (
    GroupMembership,
    GroupProject,
    MeetingSuggestion,
)
from studyFlax.tests.helpers.base import BaseTestCase
from studyFlax.tests.helpers.factories import make_user


def _make_project(owner, name="Test Project", course_code="CS101"):
    project = GroupProject.objects.create(name=name, course_code=course_code, owner=owner)
    GroupMembership.objects.create(project=project, user=owner, role="owner")
    return project


class SuggestionViewTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.project = _make_project(self.user)
        self.member = make_user("member", "member@e.com")
        GroupMembership.objects.create(project=self.project, user=self.member, role="member")
        self.future = timezone.now() + timedelta(days=1)

    def test_create_suggestion(self):
        res = self.client.post(
            f"/api/group-work/projects/{self.project.id}/suggestions/",
            {
                "start_time": self.future.isoformat(),
                "end_time": (self.future + timedelta(hours=1)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", res.data)

    def test_create_suggestion_missing_times(self):
        res = self.client.post(
            f"/api/group-work/projects/{self.project.id}/suggestions/",
            {},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_respond_accepted(self):
        suggestion = MeetingSuggestion.objects.create(
            project=self.project,
            suggested_by=self.user,
            start_time=self.future,
            end_time=self.future + timedelta(hours=1),
        )
        self.client.force_authenticate(user=self.member)
        res = self.client.post(
            f"/api/group-work/suggestions/{suggestion.id}/respond/",
            {"status": "accepted"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "accepted")

    def test_respond_non_member(self):
        suggestion = MeetingSuggestion.objects.create(
            project=self.project,
            suggested_by=self.user,
            start_time=self.future,
            end_time=self.future + timedelta(hours=1),
        )
        outsider = make_user("outsider", "outsider@e.com")
        self.client.force_authenticate(user=outsider)
        res = self.client.post(
            f"/api/group-work/suggestions/{suggestion.id}/respond/",
            {"status": "accepted"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_respond_invalid_status(self):
        suggestion = MeetingSuggestion.objects.create(
            project=self.project,
            suggested_by=self.user,
            start_time=self.future,
            end_time=self.future + timedelta(hours=1),
        )
        res = self.client.post(
            f"/api/group-work/suggestions/{suggestion.id}/respond/",
            {"status": "maybe"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_suggestion_by_creator(self):
        suggestion = MeetingSuggestion.objects.create(
            project=self.project,
            suggested_by=self.user,
            start_time=self.future,
            end_time=self.future + timedelta(hours=1),
        )
        res = self.client.delete(f"/api/group-work/suggestions/{suggestion.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_suggestion_by_non_creator(self):
        suggestion = MeetingSuggestion.objects.create(
            project=self.project,
            suggested_by=self.user,
            start_time=self.future,
            end_time=self.future + timedelta(hours=1),
        )
        self.client.force_authenticate(user=self.member)
        res = self.client.delete(f"/api/group-work/suggestions/{suggestion.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
