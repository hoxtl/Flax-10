import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from studyFlax.models.calendar import CalendarEvent, Tag, RecurrenceRule
from studyFlax.serialisers.calendar.event_serialisers import (
    CalendarEventSerialiser,
    CalendarEventCreateSerialiser
)
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

class CalendarEventSerialiserTests(TestCase):
    """Test CalendarEventSerialiser."""

    def setUp(self):
        self.user = User.objects.create_user(username='test', email='t@t.com', password='pass')
        self.tag = Tag.objects.create(user=self.user, name='Tag', color='#FF0000')

    def test_includes_location_fields(self):
        """Test serializer includes all location fields."""
        event = CalendarEvent.objects.create(
            user=self.user, title='Event',
            start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1),
            location='Strand', location_latitude=51.5118, location_longitude=-0.1161,
            location_validated=True, tag=self.tag
        )
        data = CalendarEventSerialiser(instance=event).data
        
        self.assertEqual(data['location_latitude'], 51.5118)
        self.assertEqual(data['location_longitude'], -0.1161)
        self.assertTrue(data['location_validated'])

    def test_null_location_coordinates(self):
        """Test with null coordinates."""
        event = CalendarEvent.objects.create(
            user=self.user, title='Event',
            start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1)
        )
        data = CalendarEventSerialiser(instance=event).data
        
        self.assertIsNone(data['location_latitude'])
        self.assertIsNone(data['location_longitude'])
        self.assertFalse(data['location_validated'])

    def test_includes_tag_and_module_details(self):
        """Test tag_name, module_name, module_code fields."""
        event = CalendarEvent.objects.create(
            user=self.user, title='Event',
            start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1),
            tag=self.tag
        )
        data = CalendarEventSerialiser(instance=event).data
        
        self.assertEqual(data['tag_name'], 'Tag')
        self.assertIn('tag_details', data)
        self.assertIn('module_name', data)
        self.assertIn('module_code', data)

class CalendarEventCreateSerialiserTests(TestCase):
    """Test CalendarEventCreateSerialiser."""

    def setUp(self):
        self.user = User.objects.create_user(username='test', email='t@t.com', password='pass')
        self.tag = Tag.objects.create(user=self.user, name='Work', color='#0000FF')

    def test_create_with_location_coordinates(self):
        """Test creating event with coordinates."""
        data = {
            'title': 'Meeting', 'start_time': timezone.now(),
            'end_time': timezone.now() + timedelta(hours=1),
            'location': 'Strand', 'location_latitude': 51.5118,
            'location_longitude': -0.1161, 'location_validated': True
        }
        serializer = CalendarEventCreateSerialiser(data=data)
        self.assertTrue(serializer.is_valid())
        event = serializer.save(user=self.user)
        
        self.assertEqual(event.location_latitude, 51.5118)
        self.assertEqual(event.location_longitude, -0.1161)
        self.assertTrue(event.location_validated)

    def test_create_without_coordinates(self):
        """Test coordinates default to None."""
        data = {'title': 'Event', 'start_time': timezone.now(), 'end_time': timezone.now() + timedelta(hours=1)}
        event = CalendarEventCreateSerialiser(data=data).save(user=self.user)
        
        self.assertIsNone(event.location_latitude)
        self.assertFalse(event.location_validated)

    def test_resolve_tag_by_id(self):
        """Test _resolve_tag with ID."""
        data = {'title': 'E', 'start_time': timezone.now(), 'end_time': timezone.now() + timedelta(hours=1), 'tag': str(self.tag.id)}
        event = CalendarEventCreateSerialiser(data=data).save(user=self.user)
        self.assertEqual(event.tag.id, self.tag.id)

    def test_resolve_tag_by_name_creates_new(self):
        """Test _resolve_tag creates tag from name."""
        data = {'title': 'E', 'start_time': timezone.now(), 'end_time': timezone.now() + timedelta(hours=1), 'tag': 'NewTag'}
        event = CalendarEventCreateSerialiser(data=data).save(user=self.user)
        self.assertEqual(event.tag.name, 'NewTag')
        self.assertTrue(event.tag.is_default)

    def test_resolve_tag_none(self):
        """Test _resolve_tag with None/empty."""
        for tag_val in [None, '']:
            data = {'title': 'E', 'start_time': timezone.now(), 'end_time': timezone.now() + timedelta(hours=1), 'tag': tag_val}
            event = CalendarEventCreateSerialiser(data=data).save(user=self.user)
            self.assertIsNone(event.tag)

    def test_create_with_recurrence_dict(self):
        """Test recurrence as dict."""
        data = {
            'title': 'Recurring', 'start_time': timezone.now(), 'end_time': timezone.now() + timedelta(hours=1),
            'recurrence_rule': {'frequency': 'WEEKLY', 'interval': 1, 'count': 10}
        }
        event = CalendarEventCreateSerialiser(data=data).save(user=self.user)
        
        self.assertIsNotNone(event.recurrence_rule)
        self.assertEqual(event.recurrence_rule.frequency, 'WEEKLY')

    def test_invalid_json_recurrence(self):
        """Test _parse_recurrence_input with invalid JSON."""
        data = {'title': 'E', 'start_time': timezone.now(), 'end_time': timezone.now() + timedelta(hours=1), 'recurrence_rule': 'bad-json{'}
        event = CalendarEventCreateSerialiser(data=data).save(user=self.user)
        self.assertIsNone(event.recurrence_rule)

    def test_null_recurrence(self):
        """Test null recurrence."""
        data = {'title': 'E', 'start_time': timezone.now(), 'end_time': timezone.now() + timedelta(hours=1), 'recurrence_rule': None}
        event = CalendarEventCreateSerialiser(data=data).save(user=self.user)
        self.assertIsNone(event.recurrence_rule)

    def test_update_location(self):
        """Test updating location coordinates."""
        event = CalendarEvent.objects.create(
            user=self.user, title='Old', start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1)
        )
        update_data = {
            'title': 'New', 'start_time': event.start_time, 'end_time': event.end_time,
            'location_latitude': 52.0, 'location_longitude': -1.0, 'location_validated': True
        }
        serializer = CalendarEventCreateSerialiser(instance=event, data=update_data)
        updated = serializer.save()
        
        self.assertEqual(updated.location_latitude, 52.0)
        self.assertTrue(updated.location_validated)