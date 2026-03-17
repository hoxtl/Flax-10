"""Tests for availability helper branches."""

from datetime import timedelta
from unittest.mock import MagicMock

from django.utils import timezone

from studyFlax.models.groupwork.groupworkModel import (
    GroupMembership,
    GroupProject,
    MeetingResponse,
    MeetingSuggestion,
)
from studyFlax.tests.helpers.base import BaseTestCase
from studyFlax.tests.helpers.factories import make_user


def _make_project(owner, name="Test Project", course_code="CS101"):
    project = GroupProject.objects.create(name=name, course_code=course_code, owner=owner)
    GroupMembership.objects.create(project=project, user=owner, role="owner")
    return project


class AvailabilityHelperCoverageTest(BaseTestCase):
    """Unit tests for _build_member_entry initials branches."""

    def test_initials_from_name_when_both_set(self):
        from studyFlax.views.groupwork.availability_view import _build_member_entry
        m = MagicMock()
        m.user.id = 1
        m.user.username = 'jdoe'
        m.user.first_name = 'Jane'
        m.user.last_name = 'Doe'
        entry = _build_member_entry(m, {1: []}, timezone.now(), timezone.now())
        self.assertEqual(entry['initials'], 'JD')

    def test_initials_from_username_when_no_name(self):
        from studyFlax.views.groupwork.availability_view import _build_member_entry
        m = MagicMock()
        m.user.id = 2
        m.user.username = 'ab_user'
        m.user.first_name = ''
        m.user.last_name = ''
        entry = _build_member_entry(m, {2: []}, timezone.now(), timezone.now())
        self.assertEqual(entry['initials'], 'AB')

    def test_serialize_responses_returns_list(self):
        from studyFlax.views.groupwork.availability_view import _serialize_responses
        project = _make_project(self.user, 'SerResp')
        member = make_user('ser_resp_m', 'ser_resp_m@e.com')
        GroupMembership.objects.create(project=project, user=member, role='member')
        future = timezone.now() + timedelta(days=1)
        suggestion = MeetingSuggestion.objects.create(
            project=project, suggested_by=self.user,
            start_time=future, end_time=future + timedelta(hours=1),
        )
        MeetingResponse.objects.create(suggestion=suggestion, user=member, status='accepted')
        result = _serialize_responses(suggestion.responses.all())
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['status'], 'accepted')
