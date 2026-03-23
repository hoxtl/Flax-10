from rest_framework import status

from studyFlax.models.groupwork.groupwork_model import GroupMembership, GroupProject
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


class AvailabilityViewHelperTest(BaseTestCase):

    def test_get_profile_photo_url_returns_none_on_exception(self):
        from studyFlax.views.groupwork.availability_view import _get_profile_photo_url
        from unittest.mock import MagicMock, PropertyMock
        user = MagicMock()
        type(user).profile_photo = PropertyMock(side_effect=Exception('no file'))
        result = _get_profile_photo_url(user)
        self.assertIsNone(result)

    def test_build_member_statuses_sets_suggester_accepted(self):
        from studyFlax.views.groupwork.availability_view import _build_member_statuses
        from unittest.mock import MagicMock
        membership = MagicMock()
        membership.user.id = 1
        membership.user.username = 'alice'
        membership.user.first_name = 'Alice'
        membership.user.last_name = 'A'
        membership.user.profile_photo = None
        suggestion = MagicMock()
        suggestion.suggested_by_id = 1
        suggestion.responses.all.return_value = []
        result = _build_member_statuses(suggestion, [membership])
        self.assertEqual(result[0]['status'], 'accepted')
        self.assertTrue(result[0]['is_suggester'])

    def test_serialise_active_suggestion_counts_statuses(self):
        from studyFlax.views.groupwork.availability_view import _serialise_active_suggestion
        from unittest.mock import MagicMock
        from django.utils import timezone
        m1 = MagicMock()
        m1.user.id = 1
        m1.user.username = 'alice'
        m1.user.first_name = 'Alice'
        m1.user.last_name = 'A'
        m1.user.profile_photo = None
        suggestion = MagicMock()
        suggestion.suggested_by_id = 1
        suggestion.suggested_by.id = 1
        suggestion.suggested_by.username = 'alice'
        suggestion.responses.all.return_value = []
        suggestion.start_time = timezone.now()
        suggestion.end_time = timezone.now()
        result = _serialise_active_suggestion(suggestion, [m1])
        self.assertEqual(result['accepted_count'], 1)
        self.assertEqual(result['rejected_count'], 0)
        self.assertEqual(result['pending_count'], 0)
