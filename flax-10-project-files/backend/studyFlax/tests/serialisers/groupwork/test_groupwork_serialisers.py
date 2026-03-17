from studyFlax.models.groupwork.groupworkModel import GroupMembership, GroupProject
from studyFlax.serialisers.tasks.groupwork_serialisers import (
    GroupMembershipSerialiser,
)
from studyFlax.tests.helpers.base import BaseTestCase


def _make_project(owner, name="Test Project", course_code="CS101"):
    project = GroupProject.objects.create(name=name, course_code=course_code, owner=owner)
    GroupMembership.objects.create(project=project, user=owner, role="owner")
    return project


class GroupMembershipSerialiserTests(BaseTestCase):
    def test_profile_photo_url_none_when_no_photo(self):
        project = _make_project(self.user)
        membership = GroupMembership.objects.get(project=project, user=self.user)
        serialiser = GroupMembershipSerialiser(membership)
        self.assertIsNone(serialiser.data["profile_photo_url"])
