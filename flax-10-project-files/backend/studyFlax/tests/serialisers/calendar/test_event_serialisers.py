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