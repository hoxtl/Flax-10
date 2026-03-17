"""Tests for groupwork views, serialisers, models, fixtures, and signals."""

from datetime import timedelta
from unittest.mock import PropertyMock, patch

from django.utils import timezone
from rest_framework import status

from studyFlax.fixtures.groupwork_fixtures import (
    GROUP_PROJECT_FIXTURES,
    GROUP_TASK_TEMPLATES,
)
from studyFlax.models.groupwork.groupwork_models import (
    GroupMembership,
    GroupProject,
    MeetingResponse,
    MeetingSuggestion,
)
from studyFlax.models.notifications.notificationModel import Notification
from studyFlax.serialisers.tasks.groupwork_serialisers import (
    GroupMembershipSerialiser,
)
from studyFlax.tests.helpers.base import BaseTestCase
from studyFlax.tests.helpers.factories import make_user


def _make_project(owner, name="Test Project", course_code="CS101"):
    project = GroupProject.objects.create(name=name, course_code=course_code, owner=owner)
    GroupMembership.objects.create(project=project, user=owner, role="owner")
    return project


class GroupProjectListTests(BaseTestCase):
    def test_create_project(self):
        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "course_code": "CS100"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "Alpha")
        self.assertTrue(
            GroupMembership.objects.filter(
                project_id=res.data["id"], user=self.user, role="owner"
            ).exists()
        )

    def test_create_project_invalid(self):
        res = self.client.post("/api/group-work/projects/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_projects(self):
        _make_project(self.user, "P1")
        _make_project(self.user, "P2")
        other = make_user("other", "other@e.com")
        _make_project(other, "P3")
        res = self.client.get("/api/group-work/projects/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        names = {p["name"] for p in res.data}
        self.assertIn("P1", names)
        self.assertIn("P2", names)
        self.assertNotIn("P3", names)


class GroupProjectMembersTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.project = _make_project(self.user)
        self.member = make_user("member", "member@e.com")

    def test_get_members(self):
        res = self.client.get(f"/api/group-work/projects/{self.project.id}/members/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_add_member(self):
        res = self.client.post(
            f"/api/group-work/projects/{self.project.id}/members/",
            {"user": self.member.id, "role": "member"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_add_member_invalid(self):
        res = self.client.post(
            f"/api/group-work/projects/{self.project.id}/members/",
            {},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_existing_member_does_not_duplicate(self):
        GroupMembership.objects.create(project=self.project, user=self.member, role="member")
        res = self.client.post(
            f"/api/group-work/projects/{self.project.id}/members/",
            {"user": self.member.id},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            GroupMembership.objects.filter(project=self.project, user=self.member).count(), 1
        )


class GroupProjectDetailTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.project = _make_project(self.user)

    def test_patch_project(self):
        res = self.client.patch(
            f"/api/group-work/projects/{self.project.id}/",
            {"name": "Updated"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "Updated")

    def test_patch_project_invalid(self):
        res = self.client.patch(
            f"/api/group-work/projects/{self.project.id}/",
            {"name": ""},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_project_owner(self):
        res = self.client.delete(f"/api/group-work/projects/{self.project.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GroupProject.objects.filter(id=self.project.id).exists())

    def test_delete_project_non_owner(self):
        member = make_user("member", "member@e.com")
        GroupMembership.objects.create(project=self.project, user=member, role="member")
        self.client.force_authenticate(user=member)
        res = self.client.delete(f"/api/group-work/projects/{self.project.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class GroupProjectMemberDetailTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.project = _make_project(self.user)
        self.member = make_user("member", "member@e.com")
        self.membership = GroupMembership.objects.create(
            project=self.project, user=self.member, role="member"
        )

    def test_owner_removes_member(self):
        url = f"/api/group-work/projects/{self.project.id}/members/{self.membership.id}/"
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GroupMembership.objects.filter(id=self.membership.id).exists())

    def test_non_owner_cannot_remove_member(self):
        self.client.force_authenticate(user=self.member)
        url = f"/api/group-work/projects/{self.project.id}/members/{self.membership.id}/"
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_remove_owner(self):
        owner_membership = GroupMembership.objects.get(
            project=self.project, user=self.user
        )
        url = f"/api/group-work/projects/{self.project.id}/members/{owner_membership.id}/"
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class GroupAvailabilityTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.project = _make_project(self.user)

    def test_availability_returns_200(self):
        res = self.client.get(
            f"/api/group-work/projects/{self.project.id}/availability/"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("suggestions", res.data)
        self.assertIn("active_suggestions", res.data)
        self.assertIn("current_user_id", res.data)

    def test_availability_slots_structure(self):
        res = self.client.get(
            f"/api/group-work/projects/{self.project.id}/availability/"
        )
        if res.data["suggestions"]:
            slot = res.data["suggestions"][0]
            self.assertIn("start", slot)
            self.assertIn("label", slot)
            self.assertIn("free_count", slot)
            self.assertIn("total_count", slot)
            self.assertIn("members", slot)


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


class GroupworkModelStrTests(BaseTestCase):
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


class GroupMembershipSerialiserTests(BaseTestCase):
    def test_profile_photo_url_none_when_no_photo(self):
        project = _make_project(self.user)
        membership = GroupMembership.objects.get(project=project, user=self.user)
        serialiser = GroupMembershipSerialiser(membership)
        self.assertIsNone(serialiser.data["profile_photo_url"])


class GroupworkSignalTests(BaseTestCase):
    def test_member_added_creates_notification(self):
        project = GroupProject.objects.create(name="Signals", owner=self.user)
        GroupMembership.objects.create(project=project, user=self.user, role="owner")
        member = make_user("member", "member@e.com")
        initial_count = Notification.objects.filter(user=member).count()
        GroupMembership.objects.create(project=project, user=member, role="member")
        self.assertEqual(
            Notification.objects.filter(user=member).count(), initial_count + 1
        )

    def test_owner_membership_does_not_create_notification(self):
        project = GroupProject.objects.create(name="Signals2", owner=self.user)
        initial = Notification.objects.filter(user=self.user).count()
        GroupMembership.objects.create(project=project, user=self.user, role="owner")
        self.assertEqual(Notification.objects.filter(user=self.user).count(), initial)

    def test_update_membership_does_not_create_notification(self):
        project = GroupProject.objects.create(name="Signals3", owner=self.user)
        member = make_user("member2", "member2@e.com")
        GroupMembership.objects.create(project=project, user=member, role="member")
        initial = Notification.objects.filter(user=member).count()
        m = GroupMembership.objects.get(project=project, user=member)
        m.role = "member"
        m.save()
        self.assertEqual(Notification.objects.filter(user=member).count(), initial)


class GroupworkFixturesTests(BaseTestCase):
    def test_fixtures_are_defined(self):
        self.assertGreater(len(GROUP_PROJECT_FIXTURES), 0)
        self.assertGreater(len(GROUP_TASK_TEMPLATES), 0)
        self.assertEqual(len(GROUP_PROJECT_FIXTURES[0]), 3)
        self.assertEqual(len(GROUP_TASK_TEMPLATES[0]), 4)


