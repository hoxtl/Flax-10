"""
Tests for auto scheduler window and allocation helpers.
"""

from datetime import date, datetime, time, timedelta
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.utils import timezone


class AutoSchedulerWindowsTest(TestCase):
    """Tests auto scheduler windows."""
    def test_night_preference_returns_bounded_night_window(self):
        from studyFlax.views.calendar.auto_scheduler_windows import _apply_worktime_pref
        day = date(2026, 3, 23)
        start = datetime.combine(day, time(0, 0))
        end = datetime.combine(day + timedelta(days=1), time(6, 0))
        result_start, result_end = _apply_worktime_pref(start, end, day, 'night')
        self.assertEqual(result_start, datetime.combine(day, time(18, 0)))
        self.assertEqual(result_end, datetime.combine(day + timedelta(days=1), time(2, 0)))

    def test_is_allowed_day_weekends_allows_saturday(self):
        from studyFlax.views.calendar.auto_scheduler_windows import _is_allowed_day
        saturday = date(2026, 3, 21)
        self.assertTrue(_is_allowed_day(saturday, 'weekends'))

    def test_is_allowed_day_weekends_blocks_monday(self):
        from studyFlax.views.calendar.auto_scheduler_windows import _is_allowed_day
        monday = date(2026, 3, 23)
        self.assertFalse(_is_allowed_day(monday, 'weekends'))

    def test_is_allowed_day_weekdays_allows_monday(self):
        from studyFlax.views.calendar.auto_scheduler_windows import _is_allowed_day
        monday = date(2026, 3, 23)
        self.assertTrue(_is_allowed_day(monday, 'weekdays'))

    def test_is_allowed_day_weekdays_blocks_saturday(self):
        from studyFlax.views.calendar.auto_scheduler_windows import _is_allowed_day
        saturday = date(2026, 3, 21)
        self.assertFalse(_is_allowed_day(saturday, 'weekdays'))


class GapBeforeBusySlotTest(TestCase):
    """Tests gap before busy slot."""
    def test_returns_none_when_busy_slot_already_past(self):
        from studyFlax.views.calendar.auto_scheduler_allocations import _gap_before_busy_slot
        current = datetime(2026, 3, 23, 11, 0)
        busy_start = datetime(2026, 3, 23, 9, 0)
        busy_end = datetime(2026, 3, 23, 10, 0)
        result = _gap_before_busy_slot(current, busy_start, busy_end, timedelta(minutes=30))
        self.assertIsNone(result)

    def test_returns_tuple_when_gap_is_large_enough(self):
        from studyFlax.views.calendar.auto_scheduler_allocations import _gap_before_busy_slot
        current = datetime(2026, 3, 23, 8, 0)
        busy_start = datetime(2026, 3, 23, 10, 0)
        busy_end = datetime(2026, 3, 23, 11, 0)
        result = _gap_before_busy_slot(current, busy_start, busy_end, timedelta(minutes=30))
        self.assertEqual(result, (current, current + timedelta(minutes=30)))


class FindGapInSlotsTest(TestCase):
    """Tests find gap in slots."""
    def test_returns_gap_before_first_busy_slot(self):
        from studyFlax.views.calendar.auto_scheduler_allocations import _find_gap_in_slots
        t0 = datetime(2026, 3, 23, 8, 0)
        busy_start = datetime(2026, 3, 23, 10, 0)
        busy_end = datetime(2026, 3, 23, 11, 0)
        end = datetime(2026, 3, 23, 18, 0)
        result = _find_gap_in_slots([(busy_start, busy_end)], t0, end, timedelta(minutes=30))
        self.assertEqual(result, (t0, t0 + timedelta(minutes=30)))


class WindowBudgetTest(TestCase):
    """Tests window budget."""
    def test_returns_zero_when_window_end_before_start(self):
        from studyFlax.views.calendar.auto_scheduler_allocations import _window_budget
        user = MagicMock()
        user.settings = None
        t0 = timezone.now()
        result = _window_budget(user, t0 + timedelta(hours=1), t0)
        self.assertEqual(result, 0)


class AllocateForDeadlineTest(TestCase):
    """Tests allocate for deadline."""
    def test_returns_zero_when_minutes_is_zero(self):
        from studyFlax.views.calendar.auto_scheduler_allocations import _allocate_for_deadline
        user = MagicMock()
        deadline = MagicMock()
        deadline.start_due_date = timezone.now() + timedelta(days=7)
        t0 = timezone.now()
        result = _allocate_for_deadline(user, deadline, t0, t0 + timedelta(hours=8), 0, MagicMock(), MagicMock())
        self.assertEqual(result, 0)

    @patch('studyFlax.views.calendar.auto_scheduler_allocations._busy_slots_for_day')
    def test_returns_zero_when_no_gap_found(self, mock_busy):
        from studyFlax.views.calendar.auto_scheduler_allocations import _allocate_for_deadline
        t0 = timezone.now().replace(hour=9, minute=0, second=0, microsecond=0)
        t1 = t0 + timedelta(hours=8)
        mock_busy.return_value = [(t0, t1)]
        user = MagicMock()
        deadline = MagicMock()
        deadline.start_due_date = timezone.now() + timedelta(days=7)
        result = _allocate_for_deadline(user, deadline, t0, t1, 60, MagicMock(), MagicMock())
        self.assertEqual(result, 0)


class ProcessDayAllocationTest(TestCase):
    """Tests process day allocation."""
    def test_returns_early_for_disallowed_day(self):
        from studyFlax.views.calendar.auto_scheduler_allocations import _process_day_allocation
        saturday = date(2026, 3, 21)
        prefs = {
            'week_preference': 'weekdays',
            'wake_time': None,
            'sleep_time': None,
            'worktime_preference': 'both',
        }
        user = MagicMock()
        _process_day_allocation(saturday, user, [], {}, prefs, MagicMock(), MagicMock())
        user.events.filter.assert_not_called()
