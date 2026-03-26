"""
Tests for groupwork serialisers.
"""

from unittest.mock import MagicMock

from studyFlax.models.groupwork.groupwork_model import GroupMembership, GroupProject
from studyFlax.serialisers.tasks.groupwork_serialisers import (
    GroupMembershipSerialiser,
    GroupProjectSerialiser,
)
from studyFlax.tests.helpers.test_case_support import BaseTestCase


def _make_project(owner, name="Test Project", course_code="CS101"):
    project = GroupProject.objects.create(name=name, course_code=course_code, owner=owner)
    GroupMembership.objects.create(project=project, user=owner, role="owner")
    return project


class GroupMembershipSerialiserTests(BaseTestCase):
    """Tests group membership serialiser."""
    def test_profile_photo_url_none_when_no_photo(self):
        project = _make_project(self.user)
        membership = GroupMembership.objects.get(project=project, user=self.user)
        serialiser = GroupMembershipSerialiser(membership)
        self.assertIsNone(serialiser.data["profile_photo_url"])


class GroupProjectSerialiserPhotoTests(BaseTestCase):
    """Tests group project serialiser photo."""
    def test_tutor_photo_url_returns_http_url_unchanged(self):
        project = _make_project(self.user)
        project.module_tutor_profile_photo = 'https://cdn.example.com/photo.jpg'
        serialiser = GroupProjectSerialiser(project)
        result = serialiser.get_module_tutor_profile_photo_url(project)
        self.assertEqual(result, 'https://cdn.example.com/photo.jpg')

    def test_tutor_photo_url_returns_relative_url_without_request(self):
        project = _make_project(self.user)
        project.module_tutor_profile_photo = 'avatars/test.jpg'
        serialiser = GroupProjectSerialiser(project, context={'request': None})
        result = serialiser.get_module_tutor_profile_photo_url(project)
        self.assertIn('test.jpg', result)

    def test_tutor_photo_url_returns_none_for_empty_string(self):
        project = _make_project(self.user)
        project.module_tutor_profile_photo = ''
        serialiser = GroupProjectSerialiser(project)
        result = serialiser.get_module_tutor_profile_photo_url(project)
        self.assertIsNone(result)

    def test_tutor_photo_url_delegates_when_photo_has_url_attr(self):
        project = _make_project(self.user)
        mock_photo = MagicMock()
        mock_photo.url = '/media/photo.jpg'
        project.module_tutor_profile_photo = mock_photo
        serialiser = GroupProjectSerialiser(project, context={'request': None})
        result = serialiser.get_module_tutor_profile_photo_url(project)
        self.assertIsNone(result)

    def test_tutor_photo_url_returns_none_for_blank_path_string(self):
        class _BlankPhoto:
            """Blank photo stub."""

            def __str__(self):
                return '   '
        project = _make_project(self.user)
        project.module_tutor_profile_photo = _BlankPhoto()
        serialiser = GroupProjectSerialiser(project)
        result = serialiser.get_module_tutor_profile_photo_url(project)
        self.assertIsNone(result)
