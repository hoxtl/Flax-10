"""
Tests for suggestion views.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from studyFlax.models.groupwork.groupwork_model import GroupProject, GroupMembership, MeetingSuggestion, MeetingResponse
from django.utils import timezone
from datetime import timedelta


User = get_user_model()

class SuggestionViewsTest(TestCase):
    """Tests suggestion views."""
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(username="owner", email="o@e.com", password="p")
        self.member = User.objects.create_user(username="member", email="m@e.com", password="p")
        self.other = User.objects.create_user(username="other", email="ot@e.com", password="p")
        
        self.project = GroupProject.objects.create(name="Project", owner=self.owner)
        GroupMembership.objects.create(project=self.project, user=self.owner, role="owner")
        GroupMembership.objects.create(project=self.project, user=self.member, role="member")
        
        self.client.force_authenticate(user=self.member)

    def test_create_suggestion(self):
        url = f"/api/group-work/projects/{self.project.id}/suggestions/"
        start = (timezone.now() + timedelta(days=1)).isoformat()
        end = (timezone.now() + timedelta(days=1, hours=1)).isoformat()
        
        payload = {"start_time": start, "end_time": end}
        res = self.client.post(url, payload, format="json")
        
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(MeetingSuggestion.objects.filter(project=self.project, suggested_by=self.member).exists())

    def test_respond_to_suggestion(self):
        suggestion = MeetingSuggestion.objects.create(
            project=self.project,
            suggested_by=self.owner,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1)
        )
        url = f"/api/group-work/suggestions/{suggestion.id}/respond/"
        payload = {"status": "accepted"}
        res = self.client.post(url, payload, format="json")
        
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(MeetingResponse.objects.filter(suggestion=suggestion, user=self.member, status="accepted").exists())

    def test_delete_suggestion_permission(self):
        suggestion = MeetingSuggestion.objects.create(
            project=self.project,
            suggested_by=self.owner,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1)
        )
        url = f"/api/group-work/suggestions/{suggestion.id}/"
        
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        
        self.client.force_authenticate(user=self.owner)
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(MeetingSuggestion.objects.filter(id=suggestion.id).exists())
