"""
Tests for seeded calendar event timing guards.
"""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from django.test import SimpleTestCase

from studyFlax.management.commands.seed_helpers.academics.module_seed.enrolments import (
    _spread_coursework_deadlines,
)
from studyFlax.management.commands.seed_helpers.calendar.event_helpers import (
    SEEDED_DEADLINE_EVENING_SLOTS,
    SEEDED_DEADLINE_LATEST_START_HOUR,
    _deadline_timing,
)


class SeededCalendarEventTimingTests(SimpleTestCase):
    """Ensure seeded calendar events avoid the 11 PM slot."""

    def setUp(self):
        self.now = datetime(2026, 3, 27, 12, 0, tzinfo=timezone.utc)

    def test_seeded_coursework_deadlines_start_before_11pm(self):
        start, end, location = _deadline_timing("coursework", self.now, day_offset=3)

        self.assertIn((start.hour, start.minute), SEEDED_DEADLINE_EVENING_SLOTS)
        self.assertLess(start.hour, 23)
        self.assertIsNone(end)
        self.assertIsNone(location)

    def test_seeded_quiz_deadlines_start_before_11pm(self):
        start, end, location = _deadline_timing("quiz", self.now, day_offset=5)

        self.assertIn((start.hour, start.minute), SEEDED_DEADLINE_EVENING_SLOTS)
        self.assertLess(start.hour, 23)
        self.assertIsNone(end)
        self.assertIsNone(location)

    def test_seeded_coursework_deadlines_can_use_different_evening_slots(self):
        first_start, _, _ = _deadline_timing("coursework", self.now, day_offset=3, slot_seed=0)
        second_start, _, _ = _deadline_timing("coursework", self.now, day_offset=3, slot_seed=1)

        self.assertNotEqual(
            (first_start.hour, first_start.minute),
            (second_start.hour, second_start.minute),
        )
        self.assertLessEqual(first_start.hour, SEEDED_DEADLINE_LATEST_START_HOUR)
        self.assertLessEqual(second_start.hour, SEEDED_DEADLINE_LATEST_START_HOUR)

    def test_spreads_seeded_coursework_deadlines_to_one_per_week(self):
        base = datetime(2026, 3, 30, 20, 30, tzinfo=timezone.utc)
        deadlines = [
            SimpleNamespace(
                deadline_type="coursework",
                start_due_date=base,
                end_due_date=None,
                title="Coursework A",
                module=SimpleNamespace(module_code="CS1001"),
            ),
            SimpleNamespace(
                deadline_type="coursework",
                start_due_date=base + timedelta(days=2),
                end_due_date=None,
                title="Coursework B",
                module=SimpleNamespace(module_code="MA1001"),
            ),
            SimpleNamespace(
                deadline_type="coursework",
                start_due_date=base + timedelta(days=4),
                end_due_date=None,
                title="Coursework C",
                module=SimpleNamespace(module_code="PH1001"),
            ),
            SimpleNamespace(
                deadline_type="quiz",
                start_due_date=base + timedelta(days=1),
                end_due_date=None,
                title="Quiz",
                module=SimpleNamespace(module_code="CS1001"),
            ),
        ]

        _spread_coursework_deadlines(deadlines)

        coursework_weeks = [
            deadline.start_due_date.isocalendar()[:2]
            for deadline in deadlines
            if deadline.deadline_type == "coursework"
        ]
        self.assertEqual(len(coursework_weeks), len(set(coursework_weeks)))
        self.assertEqual(deadlines[-1].start_due_date, base + timedelta(days=1))
