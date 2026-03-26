"""
Backend tests for event views.
"""

from rest_framework import status
from ...helpers.test_case_support import BaseEventTestCase
from ...helpers.test_fixture_builders import (
    create_simple_event, create_minimal_event,
    create_recurring_event, get_datetime_str
)
from studyFlax.models import CalendarEvent


class EventCreateTests(BaseEventTestCase):
    """Tests for creating events."""
    
    def test_create_simple_event(self):
        """Test create simple event."""
        data = create_simple_event()
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        self.assert_event_data(response.data, data)
        self.assertEqual(CalendarEvent.objects.count(), 1)

    def test_create_minimal_event(self):
        """Test create minimal event."""
        data = create_minimal_event()
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], data['title'])

    def test_create_event_with_tag(self):
        """Test create event with tag."""
        tag = self.get_tag_by_name('study')
        data = {**create_simple_event(), 'tag': tag.id}
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tag'], tag.id)

    def test_create_recurring_event(self):
        """Test create recurring event."""
        data = create_recurring_event()
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        event = CalendarEvent.objects.get(id=response.data['id'])
        self.assertIsNotNone(event.recurrence_rule)

    def test_create_event_missing_title(self):
        """Test create event missing title."""
        data = {'start_time': get_datetime_str(), 'end_time': get_datetime_str(hours_offset=1)}
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)

    def test_create_event_invalid_datetime(self):
        """Test create event invalid datetime."""
        data = {**create_simple_event(), 'start_time': 'invalid'}
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)

class EventListTests(BaseEventTestCase):
    """Tests for listing events."""
    
    def test_list_all_events(self):
        """Test list all events."""
        self.create_event_in_db(create_simple_event("Event 1"))
        self.create_event_in_db(create_simple_event("Event 2"))
        response = self.client.get(self.url)
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_empty_events(self):
        """Test list empty events."""
        response = self.client.get(self.url)
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_list_events_with_date_filter(self):
        """Test list events with date filter."""
        self.create_event_in_db(create_simple_event())
        start = get_datetime_str(days_offset=-1)
        end = get_datetime_str(days_offset=1)
        response = self.client.get(f"{self.url}?start={start}&end={end}")
        self.assert_event_response(response, status.HTTP_200_OK)

class EventDetailTests(BaseEventTestCase):
    """Tests for event detail operations."""
    
    def test_get_event_by_id(self):
        """Test get event by ID."""
        event = self.create_event_in_db(create_simple_event())
        response = self.client.get(f"{self.url}{event.id}/")
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], event.id)

    def test_get_nonexistent_event(self):
        """Test get nonexistent event."""
        response = self.client.get(f"{self.url}9999/")
        self.assert_event_response(response, status.HTTP_404_NOT_FOUND)

class EventUpdateTests(BaseEventTestCase):
    """Tests for updating events."""
    
    def test_update_event_title(self):
        """Test update event title."""
        event = self.create_event_in_db(create_simple_event())
        data = {'title': 'Updated Title'}
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')

    def test_update_event_times(self):
        """Test update event times."""
        event = self.create_event_in_db(create_simple_event())
        new_start = get_datetime_str(hours_offset=2)
        data = {'start_time': new_start}
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)

    def test_update_event_tag(self):
        """Test update event tag."""
        event = self.create_event_in_db(create_simple_event())
        tag = self.get_tag_by_name('class')
        data = {'tag': tag.id}
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(response.data['tag'], tag.id)

    def test_update_event_create_new_tag(self):
        """Test update event create new tag."""
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
        """Test update event add recurrence."""
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
        """Test update event modify recurrence."""
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
        """Test update event remove recurrence."""
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        
        data = {"recurrence_rule": None}
        response = self.client.put(f"{self.url}{event_id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        
        event = CalendarEvent.objects.get(id=event_id)
        self.assertIsNone(event.recurrence_rule)

    def test_update_event_validation_error(self):
        """Test update event validation error."""
        event = self.create_event_in_db(create_simple_event())
        data = {'title': ''} 
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)

    def test_update_event_invalid_recurrence_json(self):
        """Test update event invalid recurrence JSON."""
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
        """Test delete event."""
        event = self.create_event_in_db(create_simple_event())
        response = self.client.delete(f"{self.url}{event.id}/")
        self.assert_event_response(response, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CalendarEvent.objects.count(), 0)

    def test_delete_nonexistent_event(self):
        """Test delete nonexistent event."""
        response = self.client.delete(f"{self.url}9999/")
        self.assert_event_response(response, status.HTTP_404_NOT_FOUND)

    def test_delete_recurring_event(self):
        """Test delete recurring event."""
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        response = self.client.delete(f"{self.url}{event_id}/")
        self.assert_event_response(response, status.HTTP_204_NO_CONTENT)

class ExceptionDateViewTests(BaseEventTestCase):
    """Tests for adding exception dates to recurring events."""
    
    def test_add_exception_date(self):
        """Test add exception date."""
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
        """Test add exception to non recurring."""
        event = self.create_event_in_db(create_simple_event())
        exception_data = {'date': '2026-02-15'}
        url = f"{self.url}{event.id}/exception/"
        response = self.client.post(url, exception_data, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)

    def test_add_exception_without_date(self):
        """Test add exception without date."""
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        url = f"{self.url}{event_id}/exception/"
        response = self.client.post(url, {}, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)

    def test_add_duplicate_exception_date_is_idempotent(self):
        """Test add duplicate exception date is idempotent."""
        from studyFlax.views.calendar.event_detail_view import _append_exception_date
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event = CalendarEvent.objects.get(id=response.data['id'])
        existing_date = '2026-03-01'
        event.recurrence_rule.exception_dates = [existing_date]
        event.recurrence_rule.save()
        _append_exception_date(event, existing_date)
        event.recurrence_rule.refresh_from_db()
        self.assertEqual(event.recurrence_rule.exception_dates.count(existing_date), 1)


