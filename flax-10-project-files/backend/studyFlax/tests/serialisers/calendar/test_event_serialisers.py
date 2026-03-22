import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from studyFlax.models.calendar import CalendarEvent, Tag, RecurrenceRule
from studyFlax.serialisers.calendar.event_serialisers import (
    CalendarEventSerialiser,
    CalendarEventCreateSerialiser,
    RecurrenceSerialiser
)
from studyFlax.models import Module
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

class RecurrenceSerialiserTests(TestCase):
    """Test RecurrenceSerialiser."""

    def setUp(self):
        self.recurrence = RecurrenceRule.objects.create(
            frequency='WEEKLY',
            interval=1,
            count=10
        )

    def test_serializer_contains_all_fields(self):
        serializer = RecurrenceSerialiser(instance=self.recurrence)
        data = serializer.data
        
        expected_fields = ['id', 'frequency', 'interval', 'end_date', 'count', 'exception_dates']
        for field in expected_fields:
            self.assertIn(field, data)

    def test_serializer_with_all_fields(self):
        recurrence = RecurrenceRule.objects.create(
            frequency='DAILY',
            interval=2,
            end_date=timezone.now().date() + timedelta(days=30),
            count=15,
            exception_dates=['2024-12-25', '2024-01-01']
        )
        
        serializer = RecurrenceSerialiser(instance=recurrence)
        data = serializer.data
        
        self.assertEqual(data['frequency'], 'DAILY')
        self.assertEqual(data['interval'], 2)
        self.assertEqual(data['count'], 15)
        self.assertIsNotNone(data['end_date'])


class CalendarEventSerialiserTests(TestCase):
    """Test CalendarEventSerialiser with location fields and related data."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.tag = Tag.objects.create(
            user=self.user,
            name='Test Tag',
            color='#FF0000'
        )
        self.module = Module.objects.create(
            module_code='TEST101',
            module_name='Test Module',
            created_by=self.user
        )
        self.recurrence = RecurrenceRule.objects.create(
            frequency='WEEKLY',
            interval=1
        )
        self.event = CalendarEvent.objects.create(
            user=self.user,
            title='Test Event',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
            location='King\'s College London',
            location_latitude=51.5118,
            location_longitude=-0.1161,
            location_validated=True,
            tag=self.tag,
            module=self.module,
            recurrence_rule=self.recurrence
        )

    def test_serializer_contains_location_fields(self):
        """Test that serializer includes location coordinate fields."""
        serializer = CalendarEventSerialiser(instance=self.event)
        data = serializer.data
        
        self.assertIn('location_latitude', data)
        self.assertIn('location_longitude', data)
        self.assertIn('location_validated', data)

    def test_serializer_with_valid_coordinates(self):
        """Test serializer with valid latitude and longitude."""
        serializer = CalendarEventSerialiser(instance=self.event)
        data = serializer.data
        
        self.assertEqual(data['location_latitude'], 51.5118)
        self.assertEqual(data['location_longitude'], -0.1161)
        self.assertEqual(data['location_validated'], True)

    def test_serializer_with_null_coordinates(self):
        """Test serializer when location coordinates are null."""
        event = CalendarEvent.objects.create(
            user=self.user,
            title='Event Without Location',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
            location_latitude=None,
            location_longitude=None,
            location_validated=False
        )
        serializer = CalendarEventSerialiser(instance=event)
        data = serializer.data
        
        self.assertIsNone(data['location_latitude'])
        self.assertIsNone(data['location_longitude'])
        self.assertEqual(data['location_validated'], False)

    def test_serializer_with_tag_details(self):
        """Test that tag_details and tag_name are included."""
        serializer = CalendarEventSerialiser(instance=self.event)
        data = serializer.data
        
        self.assertIn('tag_details', data)
        self.assertIn('tag_name', data)
        self.assertEqual(data['tag_name'], 'Test Tag')