"""
Tests for society event views.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.society.society_event_model import SocietyEvent
from studyFlax.tests.helpers.test_model_builders import make_society, make_society_admin, make_society_member


User = get_user_model()


class SocietyEventViewTest(TestCase):
    """Tests society event view."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username="admin", email="admin@example.com", password="pass")
        self.member = User.objects.create_user(username="member", email="member@example.com", password="pass")
        self.society = make_society()
        make_society_admin(self.admin, self.society)
        make_society_member(self.member, self.society)
        self.client.force_authenticate(user=self.admin)
        self.event_data = {
            "title": "Test Event",
            "start_time": (timezone.now() + timezone.timedelta(days=1)).isoformat(),
            "end_time": (timezone.now() + timezone.timedelta(days=1, hours=2)).isoformat(),
            "recurrence": "none",
        }

    def test_get_events(self):
        response = self.client.get(f"/api/societies/{self.society.id}/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_event_as_admin(self):
        response = self.client.post(f"/api/societies/{self.society.id}/events/", self.event_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_event_as_member(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(f"/api/societies/{self.society.id}/events/", self.event_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_event_detail(self):
        event = SocietyEvent.objects.create(society=self.society, **{
            "title": "Test",
            "recurrence": "none",
            "start_time": timezone.now() + timezone.timedelta(days=1),
            "end_time": timezone.now() + timezone.timedelta(days=1, hours=2),
        })
        response = self.client.get(f"/api/societies/{self.society.id}/events/{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_event_as_admin(self):
        event = SocietyEvent.objects.create(society=self.society, **{
            "title": "Test",
            "recurrence": "none",
            "start_time": timezone.now() + timezone.timedelta(days=1),
            "end_time": timezone.now() + timezone.timedelta(days=1, hours=2),
        })
        response = self.client.delete(f"/api/societies/{self.society.id}/events/{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_event_not_found(self):
        response = self.client.get(f"/api/societies/{self.society.id}/events/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_society_not_found(self):
        response = self.client.get("/api/societies/99999/events/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
