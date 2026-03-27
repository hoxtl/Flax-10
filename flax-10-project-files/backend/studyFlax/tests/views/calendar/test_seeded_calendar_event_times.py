"""
Tests for seeded calendar event timing guards.
"""

from datetime import datetime, timezone

from django.test import SimpleTestCase

from studyFlax.management.commands.seed_helpers.calendar.event_helpers import (
    SEEDED_DEADLINE_LATEST_START_HOUR,
    _deadline_timing,
)


class SeededCalendarEventTimingTests(SimpleTestCase):
    """Ensure seeded calendar events avoid the 11 PM slot."""

    def setUp(self):
        self.now = datetime(2026, 3, 27, 12, 0, tzinfo=timezone.utc)

    def test_seeded_coursework_deadlines_start_before_11pm(self):
        start, end, location = _deadline_timing("coursework", self.now, day_offset=3)

        self.assertEqual(start.hour, SEEDED_DEADLINE_LATEST_START_HOUR)
        self.assertLess(start.hour, 23)
        self.assertIsNone(end)
        self.assertIsNone(location)

    def test_seeded_quiz_deadlines_start_before_11pm(self):
        start, end, location = _deadline_timing("quiz", self.now, day_offset=5)

        self.assertEqual(start.hour, SEEDED_DEADLINE_LATEST_START_HOUR)
        self.assertLess(start.hour, 23)
        self.assertIsNone(end)
        self.assertIsNone(location)
