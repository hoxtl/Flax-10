"""
Tests for groupwork project views.
"""

from datetime import timedelta

from rest_framework import status
from django.utils import timezone

from studyFlax.models.modules.module_model import Module
from studyFlax.models.groupwork.groupwork_model import GroupMembership, GroupProject
from studyFlax.models.tasks.task_model import Task
from studyFlax.tests.helpers.test_case_support import BaseTestCase
from studyFlax.tests.helpers.test_model_builders import make_user


def _make_project(owner, name="Test Project", course_code="CS101"):
    project = GroupProject.objects.create(name=name, course_code=course_code, owner=owner)
    GroupMembership.objects.create(project=project, user=owner, role="owner")
    return project

def _add_members(project, count, prefix="member"):
    added = []
    for index in range(count):
        user = make_user(f"{prefix}_{index}", f"{prefix}_{index}@example.com")
        GroupMembership.objects.create(project=project, user=user, role="member")
        added.append(user)
    return added

class GroupProjectListTests(BaseTestCase):
    """Tests group project list."""
    def test_create_project(self):
        teammates = [
            make_user(f"alpha_teammate_{index}", f"alpha_teammate_{index}@example.com")
            for index in range(4)
        ]
        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "course_code": "CS100", "member_ids": [teammate.id for teammate in teammates]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "Alpha")
        self.assertTrue(
            GroupMembership.objects.filter(
                project_id=res.data["id"], user=self.user, role="owner"
            ).exists()
        )

    def test_create_project_with_member_ids(self):
        teammates = [
            make_user(f"teammate_{index}", f"teammate_{index}@example.com")
            for index in range(4)
        ]

        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "course_code": "CS100", "member_ids": [teammate.id for teammate in teammates]},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        for teammate in teammates:
            self.assertTrue(
                GroupMembership.objects.filter(
                    project_id=res.data["id"], user=teammate, role="member"
                ).exists()
            )
        self.assertEqual(res.data["member_count"], 5)

    def test_create_project_allows_missing_module(self):
        teammates = [
            make_user(f"module_optional_{index}", f"module_optional_{index}@example.com")
            for index in range(3)
        ]

        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "member_ids": [teammate.id for teammate in teammates]},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["course_code"], "")

    def test_create_project_allows_empty_team(self):
        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "course_code": "CS100"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["member_count"], 1)
        self.assertTrue(
            GroupMembership.objects.filter(
                project_id=res.data["id"], user=self.user, role="owner"
            ).exists()
        )

    def test_create_project_accepts_large_team(self):
        teammates = [
            make_user(f"large_team_{index}", f"large_team_{index}@example.com")
            for index in range(12)
        ]

        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "course_code": "CS100", "member_ids": [user.id for user in teammates]},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["member_count"], len(teammates) + 1)

    def test_create_project_rejects_when_owner_has_twelve_projects(self):
        for index in range(12):
            _make_project(self.user, f"Existing {index}", course_code=f"CS{index:03d}")

        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Overflow", "course_code": "CS999"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", res.data)

    def test_create_project_rejects_invalid_member_ids(self):
        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "course_code": "CS100", "member_ids": "not-a-list"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("member_ids", res.data)

    def test_create_project_invalid(self):
        res = self.client.post("/api/group-work/projects/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_rejects_past_deadline(self):
        teammates = [
            make_user(f"past_deadline_mate_{index}", f"past_deadline_mate_{index}@example.com")
            for index in range(4)
        ]
        past_date = (timezone.localdate() - timedelta(days=1)).isoformat()

        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "course_code": "CS100", "member_ids": [teammate.id for teammate in teammates], "deadline": past_date},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("deadline", res.data)

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

    def test_list_projects_includes_task_counts(self):
        project = _make_project(self.user, "Metrics")
        Task.objects.create(user=self.user, group_project=project, title="Done task", status="done", completed=True)
        Task.objects.create(user=self.user, group_project=project, title="Todo task", status="todo", completed=False)

        res = self.client.get("/api/group-work/projects/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        payload = next(project for project in res.data if project["name"] == "Metrics")
        self.assertEqual(payload["task_count"], 2)
        self.assertEqual(payload["completed_task_count"], 1)

    def test_list_projects_prefixes_tutor_names_with_dr(self):
        teacher = make_user("teacher_gp", "teacher_gp@example.com")
        teacher.role = "teacher"
        teacher.first_name = "Hina"
        teacher.last_name = "Patel"
        teacher.save(update_fields=["role", "first_name", "last_name"])
        Module.objects.create(
            module_code="CS101",
            module_name="Software Engineering",
            created_by=teacher,
            start_time=timezone.now(),
            end_time=timezone.now(),
        )
        _make_project(self.user, "Tutor Project", course_code="CS101")

        res = self.client.get("/api/group-work/projects/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        payload = next(project for project in res.data if project["name"] == "Tutor Project")
        self.assertEqual(payload["module_tutor_name"], "Dr. Hina Patel")

    def test_list_projects_caps_response_at_twelve(self):
        for index in range(14):
            _make_project(self.user, f"Project {index}", course_code=f"CS{index:03d}")

        res = self.client.get("/api/group-work/projects/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 12)

class GroupProjectDetailTests(BaseTestCase):
    """Tests group project detail."""
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

    def test_patch_project_rejects_past_deadline(self):
        past_date = (timezone.localdate() - timedelta(days=1)).isoformat()

        res = self.client.patch(
            f"/api/group-work/projects/{self.project.id}/",
            {"deadline": past_date},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("deadline", res.data)

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

class GroupProjectMembersTests(BaseTestCase):
    """Tests group project members."""
    def setUp(self):
        super().setUp()
        self.project = _make_project(self.user)

    def test_owner_can_add_project_member(self):
        teammate = make_user("team_owner_add", "team_owner_add@example.com")

        res = self.client.post(
            f"/api/group-work/projects/{self.project.id}/members/",
            {"user": teammate.id, "role": "member"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(GroupMembership.objects.filter(project=self.project, user=teammate, role="member").exists())

    def test_non_owner_cannot_add_project_member(self):
        member = make_user("member_editor", "member_editor@example.com")
        teammate = make_user("blocked_add", "blocked_add@example.com")
        GroupMembership.objects.create(project=self.project, user=member, role="member")
        self.client.force_authenticate(user=member)

        res = self.client.post(
            f"/api/group-work/projects/{self.project.id}/members/",
            {"user": teammate.id, "role": "member"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(GroupMembership.objects.filter(project=self.project, user=teammate).exists())

    def test_owner_can_add_members_without_limit(self):
        _add_members(self.project, 12, prefix="growing_team")
        teammate = make_user("overflow_member", "overflow_member@example.com")

        res = self.client.post(
            f"/api/group-work/projects/{self.project.id}/members/",
            {"user": teammate.id, "role": "member"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(GroupMembership.objects.filter(project=self.project, user=teammate).exists())

    def test_owner_cannot_add_member_already_at_twelve_projects(self):
        teammate = make_user("busy_member", "busy_member@example.com")
        for index in range(12):
            _make_project(teammate, f"Busy {index}", course_code=f"CS{index:03d}")

        res = self.client.post(
            f"/api/group-work/projects/{self.project.id}/members/",
            {"user": teammate.id, "role": "member"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(GroupMembership.objects.filter(project=self.project, user=teammate).exists())

    def test_owner_can_remove_members_without_minimum(self):
        members = _add_members(self.project, 2, prefix="min_team")

        membership = GroupMembership.objects.get(project=self.project, user=members[0])
        res = self.client.delete(
            f"/api/group-work/projects/{self.project.id}/members/{membership.id}/"
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(GroupMembership.objects.filter(id=membership.id).exists())

class GroupProjectViewHelpersTest(BaseTestCase):
    """Tests group project view helpers."""
    def test_create_project_with_future_deadline_succeeds(self):
        future = (timezone.localdate() + timedelta(days=7)).isoformat()
        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Deadline Project", "deadline": future},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_create_project_with_invalid_member_id_string_returns_400(self):
        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Bad Members", "member_ids": ["invalid"]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_project_with_nonexistent_member_returns_400(self):
        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Ghost Members", "member_ids": [99999]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_member_ids_returns_response_when_none(self):
        from studyFlax.views.groupwork.groupwork_view import _validate_member_ids
        result = _validate_member_ids(None)
        self.assertIsNotNone(result)
        self.assertEqual(result.status_code, 400)

    def test_create_project_with_non_list_member_ids_returns_400(self):
        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Bad Type", "member_ids": "not-a-list"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
