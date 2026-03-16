"""
Backend tests for society sync service.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, datetime, timezone as dt_timezone

from studyFlax.models.society.societyMembershipModel import SocietyMembership
from studyFlax.models.society.societyEventModel import SocietyEvent
from studyFlax.models.society.societyCalendarSyncModel import SocietyCalendarSync
from studyFlax.tests.helpers.factories import make_user, make_society

def make_event(society, title='Event', recurrence='none', start=None, end=None):
    start = start or timezone.now() + timedelta(days=1)
    end = end or start + timedelta(hours=2)
    return SocietyEvent.objects.create(
        society=society, title=title, start_time=start, end_time=end, recurrence=recurrence
    )

class GetSyncedSocietyIdsTest(TestCase):
    """Tests for get synced society ids."""
    def setUp(self):
        self.user = make_user()
        self.society = make_society()

    def test_returns_empty_if_no_syncs(self):
        from studyFlax.views.calendar.society_sync_service import get_synced_society_ids
        result = get_synced_society_ids(self.user)
        self.assertEqual(result, [])

    def test_returns_synced_society_ids(self):
        from studyFlax.views.calendar.society_sync_service import get_synced_society_ids
        SocietyCalendarSync.objects.create(user=self.user, society=self.society)
        result = get_synced_society_ids(self.user)
        self.assertIn(self.society.id, result)

class GetSyncedSocietyEventsTest(TestCase):
    """Tests for get synced society events."""
    def setUp(self):
        self.user = make_user()
        self.society = make_society()
        SocietyMembership.objects.create(user=self.user, society=self.society, role='member')

    def test_no_syncs_returns_empty(self):
        from studyFlax.views.calendar.society_sync_service import get_synced_society_events
        result = get_synced_society_events(self.user)
        self.assertEqual(result, [])

    def test_returns_events_from_synced_societies(self):
        from studyFlax.views.calendar.society_sync_service import get_synced_society_events
        SocietyCalendarSync.objects.create(user=self.user, society=self.society)
        make_event(self.society, 'Weekly Training')
        result = get_synced_society_events(self.user)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['title'], 'Weekly Training')

    def test_does_not_return_unsynced_society_events(self):
        from studyFlax.views.calendar.society_sync_service import get_synced_society_events
        other_society = make_society('Other')
        make_event(other_society, 'Hidden Event')
        result = get_synced_society_events(self.user)
        self.assertEqual(result, [])

class SerializeEventTest(TestCase):
    """Tests for serialize event."""
    def setUp(self):
        self.user = make_user()
        self.society = make_society()

    def test_serialize_basic_event(self):
        from studyFlax.views.calendar.society_sync_service import serialize_event
        event = make_event(self.society, 'Test Event')
        data = serialize_event(event, 0)
        self.assertIn('id', data)
        self.assertEqual(data['title'], 'Test Event')
        self.assertEqual(data['source'], 'society')
        self.assertEqual(data['society_id'], self.society.id)
        self.assertIsNone(data['tag_name'])
        self.assertIsNone(data['announcement'])

    def test_serialize_event_with_override(self):
        from studyFlax.views.calendar.society_sync_service import serialize_event
        event = make_event(self.society, 'Event')
        override_start = timezone.now() + timedelta(days=7)
        override_end = override_start + timedelta(hours=2)
        data = serialize_event(event, 1, override_start, override_end)
        self.assertIn('_1', data['id'])
        self.assertEqual(data['start_time'], override_start.isoformat())

    def test_serialize_event_with_announcement(self):
        from studyFlax.views.calendar.society_sync_service import serialize_event
        from studyFlax.models.society.societyAnnouncementModel import SocietyAnnouncement
        ann = SocietyAnnouncement.objects.create(
            society=self.society, title='Announcement', content='Content'
        )
        start = timezone.now() + timedelta(days=1)
        end = start + timedelta(hours=2)
        event = SocietyEvent.objects.create(
            society=self.society, title='Ann Event',
            start_time=start, end_time=end, recurrence='none',
            announcement=ann
        )
        data = serialize_event(event, 0)
        self.assertEqual(data['announcement'], ann.id)
        self.assertIn('📢', data['title'])

class ShouldContinueTest(TestCase):
    """Tests for should continue."""
    def test_stops_when_current_exceeds_end(self):
        from studyFlax.views.calendar.society_sync_service import should_continue
        now = timezone.now()
        self.assertFalse(should_continue(now + timedelta(days=2), now, None))

    def test_continues_within_range(self):
        from studyFlax.views.calendar.society_sync_service import should_continue
        now = timezone.now()
        self.assertTrue(should_continue(now - timedelta(days=1), now + timedelta(days=1), None))

    def test_stops_when_recurrence_end_passed(self):
        from studyFlax.views.calendar.society_sync_service import should_continue
        now = timezone.now()
        yesterday = (now - timedelta(days=1)).date()
        self.assertFalse(should_continue(now, now + timedelta(days=1), yesterday))

    def test_continues_before_recurrence_end(self):
        from studyFlax.views.calendar.society_sync_service import should_continue
        now = timezone.now()
        tomorrow = (now + timedelta(days=1)).date()
        self.assertTrue(should_continue(now, now + timedelta(days=2), tomorrow))

class IsInRangeTest(TestCase):
    """Tests for is in range."""
    def test_event_fully_in_range(self):
        from studyFlax.views.calendar.society_sync_service import is_in_range
        now = timezone.now()
        self.assertTrue(is_in_range(
            now, timedelta(hours=1),
            now - timedelta(hours=1), now + timedelta(hours=2)
        ))

    def test_event_before_range(self):
        from studyFlax.views.calendar.society_sync_service import is_in_range
        now = timezone.now()
        self.assertFalse(is_in_range(
            now - timedelta(hours=3), timedelta(hours=1),
            now, now + timedelta(hours=2)
        ))

    def test_event_after_range(self):
        from studyFlax.views.calendar.society_sync_service import is_in_range
        now = timezone.now()
        self.assertFalse(is_in_range(
            now + timedelta(hours=5), timedelta(hours=1),
            now, now + timedelta(hours=2)
        ))

    def test_event_overlaps_start_of_range(self):
        from studyFlax.views.calendar.society_sync_service import is_in_range
        now = timezone.now()
        self.assertTrue(is_in_range(
            now - timedelta(minutes=30), timedelta(hours=1),
            now, now + timedelta(hours=2)
        ))

class GetNextOccurrenceTest(TestCase):
    """Tests for get next occurrence."""
    def setUp(self):
        self.base = datetime(2026, 3, 1, 10, 0, tzinfo=dt_timezone.utc)

    def test_daily(self):
        from studyFlax.views.calendar.society_sync_service import get_next_occurrence
        result = get_next_occurrence(self.base, 'daily')
        self.assertEqual(result, self.base + timedelta(days=1))

    def test_weekly(self):
        from studyFlax.views.calendar.society_sync_service import get_next_occurrence
        result = get_next_occurrence(self.base, 'weekly')
        self.assertEqual(result, self.base + timedelta(weeks=1))

    def test_biweekly(self):
        from studyFlax.views.calendar.society_sync_service import get_next_occurrence
        result = get_next_occurrence(self.base, 'biweekly')
        self.assertEqual(result, self.base + timedelta(weeks=2))

    def test_monthly(self):
        from studyFlax.views.calendar.society_sync_service import get_next_occurrence
        result = get_next_occurrence(self.base, 'monthly')
        self.assertEqual(result.month, 4)
        self.assertEqual(result.year, 2026)

    def test_yearly(self):
        from studyFlax.views.calendar.society_sync_service import get_next_occurrence
        result = get_next_occurrence(self.base, 'yearly')
        self.assertEqual(result.year, 2027)

    def test_unknown_recurrence_adds_365_days(self):
        from studyFlax.views.calendar.society_sync_service import get_next_occurrence
        result = get_next_occurrence(self.base, 'unknown')
        self.assertEqual(result, self.base + timedelta(days=365))

class AddMonthTest(TestCase):
    """Tests for add month."""
    def test_normal_month(self):
        from studyFlax.views.calendar.society_sync_service import add_month
        dt = datetime(2026, 1, 15, tzinfo=dt_timezone.utc)
        result = add_month(dt)
        self.assertEqual(result.month, 2)
        self.assertEqual(result.year, 2026)

    def test_month_rollover_to_next_year(self):
        from studyFlax.views.calendar.society_sync_service import add_month
        dt = datetime(2026, 12, 1, tzinfo=dt_timezone.utc)
        result = add_month(dt)
        self.assertEqual(result.month, 1)
        self.assertEqual(result.year, 2027)

    def test_clamps_to_28_for_long_months(self):
        from studyFlax.views.calendar.society_sync_service import add_month
        dt = datetime(2026, 1, 31, tzinfo=dt_timezone.utc)
        result = add_month(dt)
        self.assertEqual(result.day, 28)

class AddYearTest(TestCase):
    """Tests for add year."""
    def test_normal_year(self):
        from studyFlax.views.calendar.society_sync_service import add_year
        dt = datetime(2026, 3, 1, tzinfo=dt_timezone.utc)
        result = add_year(dt)
        self.assertEqual(result.year, 2027)

    def test_leap_day_handled(self):
        from studyFlax.views.calendar.society_sync_service import add_year
        dt = datetime(2024, 2, 29, tzinfo=dt_timezone.utc)
        result = add_year(dt)
        self.assertEqual(result.year, 2025)
        self.assertEqual(result.day, 28)

class ExpandRecurringTest(TestCase):
    """Tests for expand recurring."""
    def setUp(self):
        self.user = make_user()
        self.society = make_society()

    def test_no_dates_returns_single(self):
        from studyFlax.views.calendar.society_sync_service import expand_recurring
        event = make_event(self.society, recurrence='weekly')
        result = expand_recurring(event, None, None)
        self.assertEqual(len(result), 1)

    def test_weekly_expands_multiple(self):
        from studyFlax.views.calendar.society_sync_service import expand_recurring
        start = timezone.now()
        end = start + timedelta(hours=1)
        event = make_event(self.society, recurrence='weekly', start=start, end=end)
        view_start = start - timedelta(days=1)
        view_end = start + timedelta(weeks=4)
        result = expand_recurring(event, view_start, view_end)
        self.assertGreaterEqual(len(result), 4)

    def test_recurrence_end_date_limits_expansion(self):
        from studyFlax.views.calendar.society_sync_service import expand_recurring
        start = timezone.now()
        end = start + timedelta(hours=1)
        event = make_event(self.society, recurrence='weekly', start=start, end=end)
        event.recurrence_end_date = (start + timedelta(days=8)).date()
        event.save()
        view_start = start - timedelta(days=1)
        view_end = start + timedelta(weeks=10)
        result = expand_recurring(event, view_start, view_end)
        self.assertLessEqual(len(result), 3)

    def test_break_at_365_iterations(self):
        from studyFlax.views.calendar.society_sync_service import expand_recurring
        start = timezone.now() - timedelta(days=400)
        end = start + timedelta(hours=1)
        event = make_event(self.society, recurrence='daily', start=start, end=end)
        view_start = start
        view_end = timezone.now() + timedelta(days=10)
        result = expand_recurring(event, view_start, view_end)
        self.assertLessEqual(len(result), 366)

class ExpandAndSerializeTest(TestCase):
    """Tests for expand and serialize."""
    def setUp(self):
        self.user = make_user()
        self.society = make_society()

    def test_non_recurring_event(self):
        from studyFlax.views.calendar.society_sync_service import expand_and_serialize
        event = make_event(self.society, 'One-off', recurrence='none')
        result = expand_and_serialize([event], None, None)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['title'], 'One-off')

    def test_recurring_event_expanded(self):
        from studyFlax.views.calendar.society_sync_service import expand_and_serialize
        start = timezone.now()
        end = start + timedelta(hours=1)
        event = make_event(self.society, 'Weekly', recurrence='weekly', start=start, end=end)
        view_start = start - timedelta(days=1)
        view_end = start + timedelta(weeks=3)
        result = expand_and_serialize([event], view_start, view_end)
        self.assertGreaterEqual(len(result), 3)
