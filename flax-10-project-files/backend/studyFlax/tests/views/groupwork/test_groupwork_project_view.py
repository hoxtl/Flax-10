from rest_framework import status

from studyFlax.models.groupwork.groupwork_model import GroupMembership, GroupProject
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
