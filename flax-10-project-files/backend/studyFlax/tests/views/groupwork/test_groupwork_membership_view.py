from rest_framework import status

from studyFlax.models.groupwork.groupwork_model import (
    GroupMembership,
    GroupProject,
)
from studyFlax.tests.helpers.base import BaseTestCase
from studyFlax.tests.helpers.factories import make_user


def _make_project(owner, name="Test Project", course_code="CS101"):
    project = GroupProject.objects.create(name=name, course_code=course_code, owner=owner)
    GroupMembership.objects.create(project=project, user=owner, role="owner")
    return project


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
