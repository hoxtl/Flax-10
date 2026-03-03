from rest_framework import status
from ..base import BaseEventTestCase
from ..fixtures import (
    create_simple_event, create_minimal_event, 
    create_recurring_event, get_datetime_str
)
from studyFlax.models import CalendarEvent

class EventCreateTests(BaseEventTestCase):
    """Tests for creating events."""
    
    def test_create_simple_event(self):
        """Test creating a simple event with all fields."""
        data = create_simple_event()
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        self.assert_event_data(response.data, data)
        self.assertEqual(CalendarEvent.objects.count(), 1)
    
    def test_create_minimal_event(self):
        """Test creating event with only required fields."""
        data = create_minimal_event()
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], data['title'])
    
    def test_create_event_with_tag(self):
        """Test creating event with tag."""
        tag = self.get_tag_by_name('study')
        data = {**create_simple_event(), 'tag': tag.id}
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        self.assertEqual(response.data['tag'], tag.id)
    
    def test_create_recurring_event(self):
        """Test creating recurring event."""
        data = create_recurring_event()
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_201_CREATED)
        event = CalendarEvent.objects.get(id=response.data['id'])
        self.assertIsNotNone(event.recurrence_rule)
    
    def test_create_event_missing_title(self):
        """Test creating event without title fails."""
        data = {'start_time': get_datetime_str(), 'end_time': get_datetime_str(hours_offset=1)}
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)
    
    def test_create_event_invalid_datetime(self):
        """Test creating event with invalid datetime fails."""
        data = {**create_simple_event(), 'start_time': 'invalid'}
        response = self.client.post(self.url, data, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)

class EventListTests(BaseEventTestCase):
    """Tests for listing events."""
    
    def test_list_all_events(self):
        """Test listing all events."""
        self.create_event_in_db(create_simple_event("Event 1"))
        self.create_event_in_db(create_simple_event("Event 2"))
        response = self.client.get(self.url)
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_list_empty_events(self):
        """Test listing when no events exist."""
        response = self.client.get(self.url)
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_list_events_with_date_filter(self):
        """Test listing events filtered by date range."""
        self.create_event_in_db(create_simple_event())
        start = get_datetime_str(days_offset=-1)
        end = get_datetime_str(days_offset=1)
        response = self.client.get(f"{self.url}?start={start}&end={end}")
        self.assert_event_response(response, status.HTTP_200_OK)

class EventDetailTests(BaseEventTestCase):
    """Tests for event detail operations."""
    
    def test_get_event_by_id(self):
        """Test getting single event by ID."""
        event = self.create_event_in_db(create_simple_event())
        response = self.client.get(f"{self.url}{event.id}/")
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], event.id)
    
    def test_get_nonexistent_event(self):
        """Test getting non-existent event returns 404."""
        response = self.client.get(f"{self.url}9999/")
        self.assert_event_response(response, status.HTTP_404_NOT_FOUND)

class EventUpdateTests(BaseEventTestCase):
    """Tests for updating events."""
    
    def test_update_event_title(self):
        """Test updating event title."""
        event = self.create_event_in_db(create_simple_event())
        data = {'title': 'Updated Title'}
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')
    
    def test_update_event_times(self):
        """Test updating event times."""
        event = self.create_event_in_db(create_simple_event())
        new_start = get_datetime_str(hours_offset=2)
        data = {'start_time': new_start}
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
    
    def test_update_event_tag(self):
        """Test updating event tag."""
        event = self.create_event_in_db(create_simple_event())
        tag = self.get_tag_by_name('class')
        data = {'tag': tag.id}
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertEqual(response.data['tag'], tag.id)

    def test_update_event_create_new_tag(self):
        """Test updating event with a new tag name creates tag."""
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
        """Test adding recurrence to existing event."""
        event = self.create_event_in_db(create_simple_event())
        recurrence_data = create_recurring_event()["recurrence_rule"]
        import json
        data = {
            "recurrence_rule": recurrence_data # already json string from fixture
        }
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        event.refresh_from_db()
        self.assertIsNotNone(event.recurrence_rule)

    def test_update_event_modify_recurrence(self):
        """Test modifying existing recurrence rule."""
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
        """Test removing recurrence rule."""
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        
        data = {"recurrence_rule": None}
        response = self.client.put(f"{self.url}{event_id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        
        event = CalendarEvent.objects.get(id=event_id)
        self.assertIsNone(event.recurrence_rule)

    def test_update_event_validation_error(self):
        """Test updating event with invalid data."""
        event = self.create_event_in_db(create_simple_event())
        # Start time after end time should fail validation if serializer implements it,
        # or we can try passing invalid types.
        # Let's try passing an empty title if it's required.
        data = {'title': ''} 
        response = self.client.put(f"{self.url}{event.id}/", data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)

    def test_update_event_invalid_recurrence_json(self):
        """Test updating event with invalid JSON recurrence string."""
        event = self.create_event_in_db(create_recurring_event())
        url = f"{self.url}{event.id}/"
        
        # Invalid JSON string
        data = {
            "recurrence_rule": "invalid-json-string"
        }
        
        response = self.client.put(url, data, content_type='application/json')
        self.assert_event_response(response, status.HTTP_200_OK)
        
        # Should delete the existing rule because parsing failed
        event.refresh_from_db()
        self.assertIsNone(event.recurrence_rule)

class EventDeleteTests(BaseEventTestCase):
    """Tests for deleting events."""
    
    def test_delete_event(self):
        """Test deleting an event."""
        event = self.create_event_in_db(create_simple_event())
        response = self.client.delete(f"{self.url}{event.id}/")
        self.assert_event_response(response, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CalendarEvent.objects.count(), 0)
    
    def test_delete_nonexistent_event(self):
        """Test deleting non-existent event returns 404."""
        response = self.client.delete(f"{self.url}9999/")
        self.assert_event_response(response, status.HTTP_404_NOT_FOUND)
    
    def test_delete_recurring_event(self):
        """Test deleting recurring event deletes recurrence rule."""
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        response = self.client.delete(f"{self.url}{event_id}/")
        self.assert_event_response(response, status.HTTP_204_NO_CONTENT)

class ExceptionDateViewTests(BaseEventTestCase):
    """Tests for adding exception dates to recurring events."""
    
    def test_add_exception_date(self):
        """Test adding exception date to recurring event."""
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        exception_data = {'date': '2026-02-15'}
        url = f"{self.url}{event_id}/exception/"
        response = self.client.post(url, exception_data, format='json')
        self.assert_event_response(response, status.HTTP_200_OK)
        self.assertIn('2026-02-15', response.data['recurrence_rule']['exception_dates'])
    
    def test_add_exception_to_non_recurring(self):
        """Test adding exception to non-recurring event fails."""
        event = self.create_event_in_db(create_simple_event())
        exception_data = {'date': '2026-02-15'}
        url = f"{self.url}{event.id}/exception/"
        response = self.client.post(url, exception_data, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)
    
    def test_add_exception_without_date(self):
        """Test adding exception without date fails."""
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event_id = response.data['id']
        url = f"{self.url}{event_id}/exception/"
        response = self.client.post(url, {}, format='json')
        self.assert_event_response(response, status.HTTP_400_BAD_REQUEST)
