"""
Backend tests for society event views extended.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone

from studyFlax.models.society.society_event_model import SocietyEvent
from studyFlax.tests.helpers.test_model_builders import (
    make_society, make_society_admin, make_society_event, make_society_member,
)


User = get_user_model()

class SocietyEventCreateExtendedTest(TestCase):
    """Tests for society event create extended."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@e.com', password='pass')
        self.member = User.objects.create_user(username='member', email='member@e.com', password='pass')
        self.society = make_society()
        make_society_admin(self.admin, self.society)
        make_society_member(self.member, self.society)
        self.client.force_authenticate(user=self.admin)
        self.event_data = {
            'title': 'New Event',
            'start_time': (timezone.now() + timezone.timedelta(days=1)).isoformat(),
            'end_time': (timezone.now() + timezone.timedelta(days=1, hours=2)).isoformat(),
            'recurrence': 'none',
        }

    def test_create_event_invalid_data(self):
        response = self.client.post(f'/api/societies/{self.society.id}/events/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_event_silent_no_notification(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/events/?silent=true', self.event_data
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_event_nonexistent_society(self):
        response = self.client.post('/api/societies/99999/events/', self.event_data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_events_nonexistent_society(self):
        response = self.client.get('/api/societies/99999/events/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class SocietyEventDetailExtendedTest(TestCase):
    """Tests for society event detail extended."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin2', email='admin2@e.com', password='pass')
        self.member = User.objects.create_user(username='member2', email='member2@e.com', password='pass')
        self.other = User.objects.create_user(username='other', email='other@e.com', password='pass')
        self.society = make_society('Extended Society')
        make_society_admin(self.admin, self.society)
        make_society_member(self.member, self.society)
        self.client.force_authenticate(user=self.admin)
        self.event = make_society_event(self.society)

    def test_patch_event_as_admin(self):
        response = self.client.patch(
            f'/api/societies/{self.society.id}/events/{self.event.id}/',
            {'title': 'Updated Event'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Event')

    def test_patch_event_invalid_data(self):
        response = self.client.patch(
            f'/api/societies/{self.society.id}/events/{self.event.id}/',
            {'start_time': 'not-a-date'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_event_as_non_admin(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.patch(
            f'/api/societies/{self.society.id}/events/{self.event.id}/',
            {'title': 'Hack'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_event_as_non_admin(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.delete(
            f'/api/societies/{self.society.id}/events/{self.event.id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_event_silent(self):
        response = self.client.delete(
            f'/api/societies/{self.society.id}/events/{self.event.id}/?silent=true'
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_event_detail_nonexistent_society(self):
        response = self.client.get(f'/api/societies/99999/events/{self.event.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_event_detail_nonexistent_event(self):
        response = self.client.get(f'/api/societies/{self.society.id}/events/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_event_silent(self):
        response = self.client.patch(
            f'/api/societies/{self.society.id}/events/{self.event.id}/?silent=true',
            {'title': 'Silent Update'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class AddSocietyEventExceptionTest(TestCase):
    """Tests for add society event exception."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='excadmin', email='excadmin@e.com', password='pass')
        self.member = User.objects.create_user(username='excmember', email='excmember@e.com', password='pass')
        self.society = make_society('Exception Society')
        make_society_admin(self.admin, self.society)
        make_society_member(self.member, self.society)
        self.client.force_authenticate(user=self.admin)
        self.recurring_event = SocietyEvent.objects.create(
            society=self.society, title='Weekly Meeting',
            start_time=timezone.now() + timezone.timedelta(days=1),
            end_time=timezone.now() + timezone.timedelta(days=1, hours=2),
            recurrence='weekly',
        )
        self.one_off_event = make_society_event(self.society, 'One-Off')

    def test_add_exception_success(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/events/{self.recurring_event.id}/exception/',
            {'date': '2026-04-01'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.recurring_event.refresh_from_db()
        self.assertIn('2026-04-01', self.recurring_event.exception_dates)

    def test_add_exception_duplicate_date_ignored(self):
        self.recurring_event.exception_dates = ['2026-04-01']
        self.recurring_event.save()
        response = self.client.post(
            f'/api/societies/{self.society.id}/events/{self.recurring_event.id}/exception/',
            {'date': '2026-04-01'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.recurring_event.refresh_from_db()
        self.assertEqual(self.recurring_event.exception_dates.count('2026-04-01'), 1)

    def test_add_exception_missing_date(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/events/{self.recurring_event.id}/exception/',
            {}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date', response.data['error'])

    def test_add_exception_non_recurring_event(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/events/{self.one_off_event.id}/exception/',
            {'date': '2026-04-01'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('recurrence', response.data['error'])

    def test_add_exception_non_admin(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            f'/api/societies/{self.society.id}/events/{self.recurring_event.id}/exception/',
            {'date': '2026-04-01'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_exception_nonexistent_society(self):
        response = self.client.post(
            f'/api/societies/99999/events/{self.recurring_event.id}/exception/',
            {'date': '2026-04-01'}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_exception_nonexistent_event(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/events/99999/exception/',
            {'date': '2026-04-01'}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
