"""
Tests for event detail view edge cases: locked events, overlap limits, and CRUD.
"""

from rest_framework import status
<<<<<<< HEAD
from studyFlax.tests.helpers.test_case_support import BaseEventTestCase
from studyFlax.tests.helpers.test_fixture_builders import create_simple_event, get_datetime_str
=======
from studyFlax.tests.helpers.base import BaseEventTestCase
from studyFlax.tests.helpers.fixtures import create_simple_event, get_datetime_str
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)


class LockedEventUpdateTests(BaseEventTestCase):
    """PUT requests against locked events return 403."""

    def test_update_society_event_returns_403(self):
        event = self.create_event_in_db({**create_simple_event(), 'source': 'society'})
        response = self.client.put(
            f"{self.url}{event.id}/", {'title': 'New'}, content_type='application/json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('read-only', response.data['error'])

    def test_update_module_event_returns_403(self):
        event = self.create_event_in_db({**create_simple_event(), 'source': 'module_CS101'})
        response = self.client.put(
            f"{self.url}{event.id}/", {'title': 'New'}, content_type='application/json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_lecture_title_event_returns_403(self):
        data = create_simple_event(title='Lecture: Intro to AI')
        event = self.create_event_in_db(data)
        response = self.client.put(
            f"{self.url}{event.id}/", {'description': 'Changed'}, content_type='application/json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class LockedEventDeleteTests(BaseEventTestCase):
    """DELETE requests against locked events return 403."""

    def test_delete_society_event_returns_403(self):
        event = self.create_event_in_db({**create_simple_event(), 'source': 'society'})
        response = self.client.delete(f"{self.url}{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_module_event_returns_403(self):
        event = self.create_event_in_db({**create_simple_event(), 'source': 'module_CS101'})
        response = self.client.delete(f"{self.url}{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_lecture_title_event_returns_403(self):
        event = self.create_event_in_db(create_simple_event(title='Lecture: Physics'))
        response = self.client.delete(f"{self.url}{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class OverlapLimitUpdateTests(BaseEventTestCase):
    """PUT that exceeds overlap limit returns 400."""

    def test_update_causing_overlap_limit_returns_400(self):
        start = get_datetime_str(hours_offset=10)
        end = get_datetime_str(hours_offset=11)
<<<<<<< HEAD
        for i in range(2):
=======
        for i in range(3):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
            self.create_event_in_db({
                'title': f'Overlap {i}',
                'start_time': start,
                'end_time': end,
            })
        non_overlapping = self.create_event_in_db({
            'title': 'Move Me',
            'start_time': get_datetime_str(hours_offset=20),
            'end_time': get_datetime_str(hours_offset=21),
        })
        response = self.client.put(
            f"{self.url}{non_overlapping.id}/",
            {'start_time': start, 'end_time': end},
            content_type='application/json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('overlapping', response.data['error'])


class NormalCRUDTests(BaseEventTestCase):
    """Basic GET, PUT, DELETE on unlocked events."""

    def test_get_event_returns_200(self):
        event = self.create_event_in_db(create_simple_event())
        response = self.client.get(f"{self.url}{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], event.id)

    def test_update_normal_event_returns_200(self):
        event = self.create_event_in_db(create_simple_event())
        response = self.client.put(
            f"{self.url}{event.id}/", {'title': 'Updated'}, content_type='application/json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated')

    def test_delete_normal_event_returns_204(self):
        event = self.create_event_in_db(create_simple_event())
        response = self.client.delete(f"{self.url}{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
