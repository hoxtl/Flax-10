from datetime import timedelta

from rest_framework import status
from django.utils import timezone

from studyFlax.models.modules.module_model import Module
from studyFlax.models.groupwork.groupwork_model import GroupMembership, GroupProject
from studyFlax.models.tasks.task_model import Task
from studyFlax.tests.helpers.base import BaseTestCase
from studyFlax.tests.helpers.factories import make_user


def _make_project(owner, name="Test Project", course_code="CS101"):
    project = GroupProject.objects.create(name=name, course_code=course_code, owner=owner)
    GroupMembership.objects.create(project=project, user=owner, role="owner")
    return project


class GroupProjectListTests(BaseTestCase):
    def test_create_project(self):
        teammate = make_user("alpha_teammate", "alpha_teammate@example.com")
        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "course_code": "CS100", "member_ids": [teammate.id]},
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
        teammate = make_user("teammate", "teammate@example.com")
        teammate_two = make_user("teammate_two", "teammate_two@example.com")

        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "course_code": "CS100", "member_ids": [teammate.id, teammate_two.id]},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            GroupMembership.objects.filter(
                project_id=res.data["id"], user=teammate, role="member"
            ).exists()
        )
        self.assertTrue(
            GroupMembership.objects.filter(
                project_id=res.data["id"], user=teammate_two, role="member"
            ).exists()
        )
        self.assertEqual(res.data["member_count"], 3)

    def test_create_project_requires_module(self):
        teammate = make_user("module_required", "module_required@example.com")

        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "member_ids": [teammate.id]},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("course_code", res.data)

    def test_create_project_requires_team_members(self):
        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "course_code": "CS100", "member_ids": []},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("member_ids", res.data)

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
        teammate = make_user("past_deadline_mate", "past_deadline_mate@example.com")
        past_date = (timezone.localdate() - timedelta(days=1)).isoformat()

        res = self.client.post(
            "/api/group-work/projects/",
            {"name": "Alpha", "course_code": "CS100", "member_ids": [teammate.id], "deadline": past_date},
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
