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