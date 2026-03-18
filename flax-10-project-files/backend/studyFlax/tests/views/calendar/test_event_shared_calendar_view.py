"""
Backend tests for shared calendar event visibility.
"""

from django.contrib.auth import get_user_model
from rest_framework import status

from ..base import BaseEventTestCase

User = get_user_model()


class EventSharedCalendarTests(BaseEventTestCase):
    """Tests for shared calendar behaviour."""

    def setUp(self):
        super().setUp()
        self.owner = self.user
        self.viewer = User.objects.create_user(
            username='ev_viewer',
            email='ev_viewer@e.com',
            password='pass',
        )
        self.client.force_authenticate(user=self.viewer)

    def _make_event(self, user, title='Event', is_private=False):
        from django.utils import timezone
        from datetime import timedelta
        from studyFlax.models import CalendarEvent

        return CalendarEvent.objects.create(
            user=user,
            title=title,
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=2),
            is_private=is_private,
        )

    def test_get_shared_calendar_events(self):
        from studyFlax.models.social.share_model import CalendarShare

        CalendarShare.objects.create(owner=self.owner, shared_with=self.viewer)
        self._make_event(self.owner, 'Public Event')
        response = self.client.get(f'{self.url}?user_id={self.owner.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_private_events_masked_for_viewer(self):
        from studyFlax.models.social.share_model import CalendarShare

        CalendarShare.objects.create(owner=self.owner, shared_with=self.viewer)
        self._make_event(self.owner, 'Secret Event', is_private=True)
        response = self.client.get(f'{self.url}?user_id={self.owner.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Busy')

    def test_unshared_calendar_returns_empty(self):
        self._make_event(self.owner, 'Hidden Event')
        response = self.client.get(f'{self.url}?user_id={self.owner.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_nonexistent_user_returns_empty(self):
        response = self.client.get(f'{self.url}?user_id=99999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_own_events_not_masked(self):
        self.client.force_authenticate(user=self.owner)
        self._make_event(self.owner, 'My Secret', is_private=True)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['title'], 'My Secret')
