"""
Backend tests for event views.
"""

from rest_framework import status
from django.contrib.auth import get_user_model
from ..base import BaseEventTestCase
from ..fixtures import (
    create_simple_event, create_minimal_event, 
    create_recurring_event, get_datetime_str
)
from studyFlax.models import CalendarEvent

User = get_user_model()

class EventCreateTests(BaseEventTestCase):
    """Tests for creating events."""
    
    def test_create_simple_event(self):
        data = create_simple_event()
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        self.assert_event_data(response.data, data)
        self.assertEqual(CalendarEvent.objects.count(), 1)
    
    def test_create_minimal_event(self):
        data = create_minimal_event()
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], data['title'])
    
    def test_create_event_with_tag(self):
        tag = self.get_tag_by_name('study')
        data = {**create_simple_event(), 'tag': tag.id}
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tag'], tag.id)
    
    def test_create_recurring_event(self):
        data = create_recurring_event()
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        event = CalendarEvent.objects.get(id=response.data['id'])
        self.assertIsNotNone(event.recurrence_rule)
    
    def test_create_event_missing_title(self):
        data = {'start_time': get_datetime_str(), 'end_time': get_datetime_str(hours_offset=1)}
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)
    
    def test_create_event_invalid_datetime(self):
        data = {**create_simple_event(), 'start_time': 'invalid'}
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)

class EventListTests(BaseEventTestCase):
    """Tests for listing events."""
    
    def test_list_all_events(self):
        self.create_event_in_db(create_simple_event("Event 1"))
        self.create_event_in_db(create_simple_event("Event 2"))
        response = self.client.get(self.url)
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_list_empty_events(self):
        response = self.client.get(self.url)
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_list_events_with_date_filter(self):
        self.create_event_in_db(create_simple_event())
        start = get_datetime_str(days_offset=-1)
        end = get_datetime_str(days_offset=1)
        response = self.client.get(f"{self.url}?start={start}&end={end}")
        self.assert_event_response(response, status.HTTP_200_OK)

class EventDetailTests(BaseEventTestCase):
    """Tests for event detail operations."""
    
    def test_get_event_by_id(self):
        event = self.create_event_in_db(create_simple_event())
        response = self.client.get(f"{self.url}{event.id}/")
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], event.id)
    
    def test_get_nonexistent_event(self):
        response = self.client.get(f"{self.url}9999/")
        self.assert_event_response(response, status.HTTP_404_NOT_FOUND)

class EventUpdateTests(BaseEventTestCase):
    """Tests for updating events."""
    
    def test_update_event_title(self):
        event = self.create_event_in_db(create_simple_event())
        data = {'title': 'Updated Title'}
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')
    
    def test_update_event_times(self):
        event = self.create_event_in_db(create_simple_event())
        new_start = get_datetime_str(hours_offset=2)
        data = {'start_time': new_start}
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
    
    def test_update_event_tag(self):
        event = self.create_event_in_db(create_simple_event())
        tag = self.get_tag_by_name('class')
        data = {'tag': tag.id}
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(response.data['tag'], tag.id)

    def test_update_event_create_new_tag(self):
        event = self.create_event_in_db(create_simple_event())
        new_tag_name = "New Tag"
        data = {
            "tag": new_tag_name
        }
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        event.refresh_from_db()
        self.assertEqual(event.tag.name, new_tag_name)

    def test_update_event_add_recurrence(self):
        event = self.create_event_in_db(create_simple_event())
        recurrence_data = create_recurring_event()["recurrence_rule"]
        import json
        data = {
            "recurrence_rule": recurrence_data
        }
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        event.refresh_from_db()
        self.assertIsNotNone(event.recurrence_rule)

    def test_update_event_modify_recurrence(self):
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        
        import json
        new_rule = json.dumps({
            "frequency": "weekly",
            "interval": 2
        })
        data = {"recurrence_rule": new_rule}
        
        response = self.client.put(f"{self.url}{event_id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        
        event = CalendarEvent.objects.get(id=event_id)
        self.assertEqual(event.recurrence_rule.frequency, "weekly")
        self.assertEqual(event.recurrence_rule.interval, 2)

    def test_update_event_remove_recurrence(self):
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        
        data = {"recurrence_rule": None}
        response = self.client.put(f"{self.url}{event_id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        
        event = CalendarEvent.objects.get(id=event_id)
        self.assertIsNone(event.recurrence_rule)

    def test_update_event_validation_error(self):
        event = self.create_event_in_db(create_simple_event())
        data = {'title': ''} 
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)

    def test_update_event_invalid_recurrence_json(self):
        event = self.create_event_in_db(create_recurring_event())
        url = f"{self.url}{event.id}/"
        
        data = {
            "recurrence_rule": "invalid-json-string"
        }
        
        response = self.client.put(url, data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        
        event.refresh_from_db()
        self.assertIsNone(event.recurrence_rule)

class EventDeleteTests(BaseEventTestCase):
    """Tests for deleting events."""
    
    def test_delete_event(self):
        event = self.create_event_in_db(create_simple_event())
        response = self.client.delete(f"{self.url}{event.id}/")
        self.assert_event_response(response, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CalendarEvent.objects.count(), 0)
    
    def test_delete_nonexistent_event(self):
        response = self.client.delete(f"{self.url}9999/")
        self.assert_event_response(response, status.HTTP_404_NOT_FOUND)
    
    def test_delete_recurring_event(self):
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        response = self.client.delete(f"{self.url}{event_id}/")
        self.assert_event_response(response, status.HTTP_204_NO_CONTENT)

class ExceptionDateViewTests(BaseEventTestCase):
    """Tests for adding exception dates to recurring events."""
    
    def test_add_exception_date(self):
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        exception_data = {'date': '2026-02-15'}
        url = f"{self.url}{event_id}/exception/"
        response = self.client.post(url, exception_data, format='json')
        self.assert_event_response(response, status.HTTP_200_OK)
        event = CalendarEvent.objects.get(id=event_id)
        self.assertIn('2026-02-15', event.recurrence_rule.exception_dates)
    
    def test_add_exception_to_non_recurring(self):
        event = self.create_event_in_db(create_simple_event())
        exception_data = {'date': '2026-02-15'}
        url = f"{self.url}{event.id}/exception/"
        response = self.client.post(url, exception_data, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)
    
    def test_add_exception_without_date(self):
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        url = f"{self.url}{event_id}/exception/"
        response = self.client.post(url, {}, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)

class EventViewsSharedCalendarTest(BaseEventTestCase):
    """Tests for event views shared calendar."""
    def setUp(self):
        super().setUp()
        self.owner = self.user
        self.viewer = User.objects.create_user(username='ev_viewer', email='ev_viewer@e.com', password='pass')
        self.client.force_authenticate(user=self.viewer)

    def _make_event(self, user, title='Event', is_private=False):
        from django.utils import timezone
        from datetime import timedelta

        return CalendarEvent.objects.create(
            user=user,
            title=title,
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=2),
            is_private=is_private,
        )

    def test_get_shared_calendar_events(self):
        from studyFlax.models.social.shareModel import CalendarShare

        CalendarShare.objects.create(owner=self.owner, shared_with=self.viewer)
        self._make_event(self.owner, 'Public Event')

        response = self.client.get(f'{self.url}?user_id={self.owner.id}')

        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_private_events_masked_for_viewer(self):
        from studyFlax.models.social.shareModel import CalendarShare

        CalendarShare.objects.create(owner=self.owner, shared_with=self.viewer)
        self._make_event(self.owner, 'Secret Event', is_private=True)

        response = self.client.get(f'{self.url}?user_id={self.owner.id}')

        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Busy')

    def test_unshared_calendar_returns_empty(self):
        self._make_event(self.owner, 'Hidden Event')

        response = self.client.get(f'{self.url}?user_id={self.owner.id}')

        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_nonexistent_user_returns_empty(self):
        response = self.client.get(f'{self.url}?user_id=99999')
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_own_events_not_masked(self):
        self.client.force_authenticate(user=self.owner)
        self._make_event(self.owner, 'My Secret', is_private=True)

        response = self.client.get(self.url)

        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['title'], 'My Secret')


class EventCreateOverlapLimitTests(BaseEventTestCase):
    """Creating a 4th overlapping event returns 400."""

    def test_create_fourth_overlapping_event_returns_400(self):
        start = get_datetime_str(hours_offset=10)
        end = get_datetime_str(hours_offset=11)
        for i in range(3):
            self.create_event_in_db({
                'title': f'Overlap {i}',
                'start_time': start,
                'end_time': end,
            })
        data = {
            'title': 'Fourth Overlap',
            'start_time': start,
            'end_time': end,
        }
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)
        self.assertIn('overlapping', response.data['error'])
