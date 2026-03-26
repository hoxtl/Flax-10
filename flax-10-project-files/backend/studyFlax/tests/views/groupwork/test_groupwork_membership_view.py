"""
Tests for groupwork membership views.
"""

from unittest.mock import patch

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory

from studyFlax.models.groupwork.groupwork_model import (
    GroupMembership,
    GroupProject,
)
from studyFlax.tests.helpers.test_case_support import BaseTestCase
from studyFlax.tests.helpers.test_model_builders import make_user


def _make_project(owner, name="Test Project", course_code="CS101"):
    project = GroupProject.objects.create(name=name, course_code=course_code, owner=owner)
    GroupMembership.objects.create(project=project, user=owner, role="owner")
    return project


class GroupProjectMembersTests(BaseTestCase):
    """Tests group project members."""

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
    """Tests group project member detail."""

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


class GroupworkViewServiceCoverageTest(TestCase):
    """Tests for groupwork_view_service branches not otherwise covered."""

    def setUp(self):
        self.user = make_user('gws_user', 'gws_user@e.com')

    def test_validate_users_within_project_limit_over_limit(self):
        from studyFlax.views.groupwork.groupwork_view_service import validate_users_within_project_limit
        with patch('studyFlax.views.groupwork.groupwork_view_service.MAX_GROUP_PROJECTS_PER_USER', 0):
            result = validate_users_within_project_limit([self.user.id])
        self.assertIsNotNone(result)
        self.assertEqual(result.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_project_create_input_returns_error_when_over_limit(self):
        from studyFlax.views.groupwork.groupwork_view_service import validate_project_create_input
        with patch('studyFlax.views.groupwork.groupwork_view_service.MAX_GROUP_PROJECTS_PER_USER', 0):
            member_ids, errors, status_code = validate_project_create_input({'member_ids': [self.user.id]})
        self.assertIsNone(member_ids)
        self.assertEqual(status_code, status.HTTP_400_BAD_REQUEST)

    def test_serialised_project_accepts_request_as_context(self):
        from studyFlax.views.groupwork.groupwork_view_service import serialised_project
        project = GroupProject.objects.create(name='Svc Project', owner=self.user)
        GroupMembership.objects.create(project=project, user=self.user, role='owner')
        request = APIRequestFactory().get('/')
        result = serialised_project(project, request)
        self.assertEqual(result['name'], 'Svc Project')
