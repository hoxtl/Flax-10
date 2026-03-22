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
        """Set up test recurrence rule."""
        self.recurrence = RecurrenceRule.objects.create(
            frequency='WEEKLY',
            interval=1,
            count=10
        )

    def test_serializer_contains_all_fields(self):
        """Test that serializer includes all recurrence fields."""
        serializer = RecurrenceSerialiser(instance=self.recurrence)
        data = serializer.data
        
        expected_fields = ['id', 'frequency', 'interval', 'end_date', 'count', 'exception_dates']
        for field in expected_fields:
            self.assertIn(field, data)

    def test_serializer_with_all_fields(self):
        """Test serializer with all recurrence fields populated."""
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