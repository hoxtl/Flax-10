from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.groupwork.groupwork_models import (
    GroupProject,
    GroupMembership,
)


User = get_user_model()


def make_user(username="groupuser", email="group@example.com"):
    return User.objects.create_user(
        username=username,
        email=email,
        password="pass",
    )


class GroupProjectListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_create_project_creates_owner_membership(self):
        payload = {"name": "Group A", "course_code": "CS101"}
        res = self.client.post("/api/group-work/projects/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        project_id = res.data["id"]
        project = GroupProject.objects.get(id=project_id)
        membership = GroupMembership.objects.get(project=project, user=self.user)
        self.assertEqual(membership.role, "owner")

    def test_list_projects_only_shows_owned_or_member(self):
        other = make_user("other", "other@example.com")
        foreign = GroupProject.objects.create(
            name="Other Project",
            course_code="OTR1",
            owner=other,
        )
        GroupMembership.objects.create(
            project=foreign,
            user=other,
            role="owner",
        )
        own = GroupProject.objects.create(
            name="My Project",
            course_code="CS202",
            owner=self.user,
        )
        GroupMembership.objects.create(
            project=own,
            user=self.user,
            role="owner",
        )
        res = self.client.get("/api/group-work/projects/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        names = {item["name"] for item in res.data}
        self.assertIn("My Project", names)
        self.assertNotIn("Other Project", names)


class GroupProjectDeleteViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = make_user("owner", "owner@example.com")
        self.member = make_user("member", "member@example.com")
        self.project = GroupProject.objects.create(
            name="Deletable",
            course_code="CS303",
            owner=self.owner,
        )
        GroupMembership.objects.create(
            project=self.project,
            user=self.owner,
            role="owner",
        )
        GroupMembership.objects.create(
            project=self.project,
            user=self.member,
            role="member",
        )

    def test_owner_can_delete_project(self):
        self.client.force_authenticate(user=self.owner)
        url = f"/api/group-work/projects/{self.project.id}/"
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            GroupProject.objects.filter(id=self.project.id).exists(),
        )

    def test_member_cannot_delete_project(self):
        self.client.force_authenticate(user=self.member)
        url = f"/api/group-work/projects/{self.project.id}/"
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(
            GroupProject.objects.filter(id=self.project.id).exists(),
        )

