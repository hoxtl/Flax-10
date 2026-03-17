from rest_framework import status

from studyFlax.models.groupwork.groupworkModel import GroupMembership, GroupProject
from studyFlax.tests.helpers.base import BaseTestCase


def _make_project(owner, name="Test Project", course_code="CS101"):
    project = GroupProject.objects.create(name=name, course_code=course_code, owner=owner)
    GroupMembership.objects.create(project=project, user=owner, role="owner")
    return project


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
