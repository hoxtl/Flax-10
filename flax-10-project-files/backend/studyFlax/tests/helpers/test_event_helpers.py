"""
Backend tests for event helpers.
"""

from datetime import datetime, timedelta, timezone
from .test_case_support import BaseEventTestCase
from .test_fixture_builders import create_simple_event, create_recurring_event, get_datetime_str
from studyFlax.views.calendar.event_helpers import (
    filter_events_by_date_range, parse_date_param,
    expand_recurring_events, generate_instances,
    get_next_occurrence, is_exception_date,
    add_months, add_years, check_event_overlap,
    should_stop_generating, get_base_instance
)
from studyFlax.models import CalendarEvent, RecurrenceRule


class DateRangeFilterTests(BaseEventTestCase):
    """Tests for filtering events by date range."""
    
    def test_filter_no_params(self):
        """Test filter no params."""
        self.create_event_in_db(create_simple_event())
        queryset = CalendarEvent.objects.all()
        result = filter_events_by_date_range(queryset, {})
        self.assertEqual(result.count(), 1)

    def test_filter_by_start_date(self):
        """Test filter by start date."""
        self.create_event_in_db(create_simple_event())
        queryset = CalendarEvent.objects.all()
        params = {'start': get_datetime_str(days_offset=-1)}
        result = filter_events_by_date_range(queryset, params)
        self.assertGreater(result.count(), 0)

    def test_filter_by_end_date(self):
        """Test filter by end date."""
        self.create_event_in_db(create_simple_event())
        queryset = CalendarEvent.objects.all()
        params = {'end': get_datetime_str(days_offset=1)}
        result = filter_events_by_date_range(queryset, params)
        self.assertGreater(result.count(), 0)

    def test_filter_by_date_range(self):
        """Test filter by date range."""
        self.create_event_in_db(create_simple_event())
        queryset = CalendarEvent.objects.all()
        params = {
            'start': get_datetime_str(days_offset=-1),
            'end': get_datetime_str(days_offset=1)
        }
        result = filter_events_by_date_range(queryset, params)
        self.assertGreater(result.count(), 0)

    def test_filter_recurring_events(self):
        """Test filter recurring events."""
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        queryset = CalendarEvent.objects.all()
        params = {
            'start': get_datetime_str(days_offset=-1),
            'end': get_datetime_str(days_offset=10)
        }
        result = filter_events_by_date_range(queryset, params)
        self.assertEqual(result.count(), 1)

class DateParsingTests(BaseEventTestCase):
    """Tests for date parsing functions."""
    
    def test_parse_valid_date(self):
        """Test parse valid date."""
        date_str = "2026-02-10T14:00:00Z"
        result = parse_date_param(date_str)
        self.assertIsInstance(result, datetime)

    def test_parse_none(self):
        """Test parse none."""
        result = parse_date_param(None)
        self.assertIsNone(result)

    def test_parse_empty_string(self):
        """Test parse empty string."""
        result = parse_date_param("")
        self.assertIsNone(result)

class RecurringExpansionTests(BaseEventTestCase):
    """Tests for expanding recurring events."""
    
    def test_expand_non_recurring(self):
        """Test expand non recurring."""
        event = self.create_event_in_db(create_simple_event())
        result = expand_recurring_events([event], None, None)
        self.assertEqual(len(result), 1)

    def test_expand_recurring_without_dates(self):
        """Test expand recurring without dates."""
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event = CalendarEvent.objects.get(id=response.data['id'])
        result = expand_recurring_events([event], None, None)
        self.assertEqual(len(result), 1)

    def test_expand_recurring_with_dates(self):
        """Test expand recurring with dates."""
        event_data = create_recurring_event(count=5)
        response = self.client.post(self.url, event_data, format='json')
        event = CalendarEvent.objects.get(id=response.data['id'])
        start = datetime.now(timezone.utc)
        end = datetime.now(timezone.utc) + timedelta(days=10)
        result = expand_recurring_events([event], start, end)
        self.assertGreater(len(result), 1)

class InstanceGenerationTests(BaseEventTestCase):
    """Tests for generating recurring instances."""
    
    def test_generate_daily_instances(self):
        """Test generate daily instances."""
        event_data = create_recurring_event("daily", count=3)
        response = self.client.post(self.url, event_data, format='json')
        event = CalendarEvent.objects.get(id=response.data['id'])
        start = datetime.now(timezone.utc)
        end = datetime.now(timezone.utc) + timedelta(days=5)
        result = generate_instances(event, start, end)
        self.assertGreater(len(result), 1)

    def test_generate_weekly_instances(self):
        """Test generate weekly instances."""
        event_data = create_recurring_event("weekly", count=3)
        response = self.client.post(self.url, event_data, format='json')
        event = CalendarEvent.objects.get(id=response.data['id'])
        start = datetime.now(timezone.utc)
        end = datetime.now(timezone.utc) + timedelta(days=30)
        result = generate_instances(event, start, end)
        self.assertGreater(len(result), 1)

    def test_generate_with_exception_dates(self):
        """Test generate with exception dates."""
        event_data = create_recurring_event("daily", count=5)
        response = self.client.post(self.url, event_data, format='json')
        event = CalendarEvent.objects.get(id=response.data['id'])
        rule = event.recurrence_rule
        rule.exception_dates = [(datetime.now(timezone.utc) + timedelta(days=1)).strftime('%Y-%m-%d')]
        rule.save()
        start = datetime.now(timezone.utc)
        end = datetime.now(timezone.utc) + timedelta(days=10)
        result = generate_instances(event, start, end)
        self.assertIsNotNone(result)

    def test_generate_instances_break_loop(self):
        """Test generate instances break loop."""
        event_data = create_simple_event()
        event_data['start_time'] = datetime(2024, 1, 1, 10, 0, tzinfo=timezone.utc)
        event_data['end_time'] = datetime(2024, 1, 1, 11, 0, tzinfo=timezone.utc)
        
        rule = RecurrenceRule.objects.create(frequency='daily', interval=1, count=100)
        event = CalendarEvent.objects.create(recurrence_rule=rule, user=self.user, **event_data)
        
        start_date = event.start_time
        end_date = start_date + timedelta(days=1)
        instances = generate_instances(event, start_date, end_date)
        
        self.assertLess(len(instances), 100)
        self.assertTrue(len(instances) >= 1)

class OccurrenceCalculationTests(BaseEventTestCase):
    """Tests for calculating next occurrences."""
    
    def test_daily_occurrence(self):
        """Test daily occurrence."""
        start = datetime.now(timezone.utc)
        result = get_next_occurrence(start, 'daily', 1, 1)
        expected = start + timedelta(days=1)
        self.assertEqual(result.date(), expected.date())

    def test_weekly_occurrence(self):
        """Test weekly occurrence."""
        start = datetime.now(timezone.utc)
        result = get_next_occurrence(start, 'weekly', 1, 1)
        expected = start + timedelta(weeks=1)
        self.assertEqual(result.date(), expected.date())

    def test_monthly_occurrence(self):
        """Test monthly occurrence."""
        start = datetime(2026, 1, 15, tzinfo=timezone.utc)
        result = get_next_occurrence(start, 'monthly', 1, 1)
        self.assertEqual(result.month, 2)

    def test_yearly_occurrence(self):
        """Test yearly occurrence."""
        start = datetime(2026, 2, 10, tzinfo=timezone.utc)
        result = get_next_occurrence(start, 'yearly', 1, 1)
        self.assertEqual(result.year, 2027)

    def test_invalid_frequency(self):
        """Test invalid frequency."""
        start = datetime.now(timezone.utc)
        result = get_next_occurrence(start, 'invalid', 1, 1)
        self.assertIsNone(result)

class DateMathTests(BaseEventTestCase):
    """Tests for date arithmetic functions."""
    
    def test_add_months(self):
        """Test add months."""
        dt = datetime(2026, 1, 15, tzinfo=timezone.utc)
        result = add_months(dt, 2)
        self.assertEqual(result.month, 3)
        self.assertEqual(result.year, 2026)

    def test_add_months_year_rollover(self):
        """Test add months year rollover."""
        dt = datetime(2026, 11, 15, tzinfo=timezone.utc)
        result = add_months(dt, 3)
        self.assertEqual(result.month, 2)
        self.assertEqual(result.year, 2027)

    def test_add_years(self):
        """Test add years."""
        dt = datetime(2026, 2, 10, tzinfo=timezone.utc)
        result = add_years(dt, 2)
        self.assertEqual(result.year, 2028)

class ExceptionDateHelperTests(BaseEventTestCase):
    """Tests for exception date handling."""
    
    def test_is_exception_date_true(self):
        """Test is exception date true."""
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event = CalendarEvent.objects.get(id=response.data['id'])
        rule = event.recurrence_rule
        test_date = datetime.now(timezone.utc)
        rule.exception_dates = [test_date.strftime('%Y-%m-%d')]
        rule.save()
        result = is_exception_date(test_date, rule)
        self.assertTrue(result)

    def test_is_exception_date_false(self):
        """Test is exception date false."""
        event_data = create_recurring_event()
        response = self.client.post(self.url, event_data, format='json')
        event = CalendarEvent.objects.get(id=response.data['id'])
        rule = event.recurrence_rule
        result = is_exception_date(datetime.now(timezone.utc), rule)
        self.assertFalse(result)

class OverlapTests(BaseEventTestCase):
    """Tests for event overlap checking."""
    
    def test_no_overlap(self):
        """Test no overlap."""
        event = self.create_event_in_db(create_simple_event())
        new_event = {
            'start_time': event.end_time + timedelta(hours=1),
            'end_time': event.end_time + timedelta(hours=2)
        }
        self.assertFalse(check_event_overlap(self.user, new_event))

    def test_overlap(self):
        """Test overlap."""
        event = self.create_event_in_db(create_simple_event())
        new_event = {
            'start_time': event.start_time,
            'end_time': event.end_time
        }
        self.assertTrue(check_event_overlap(self.user, new_event))

class HelperCoverageTests(BaseEventTestCase):
    """Tests to ensure full coverage of helper functions and base methods."""
    
    def test_create_event_in_db_full_coverage(self):
        """Test create event in database full coverage."""
        from studyFlax.models import Tag
        tag = Tag.objects.create(name="CoverTest")
        recurrence_data = {"frequency": "daily", "interval": 1}
        
        event_data = create_simple_event()
        event_data["tag"] = tag.id
        event_data["recurrence_rule"] = recurrence_data
        
        event = self.create_event_in_db(event_data)
        
        self.assertEqual(event.tag, tag)
        self.assertIsNotNone(event.recurrence_rule)
        self.assertEqual(event.recurrence_rule.frequency, "daily")

    def test_base_instance_exception(self):
        """Test base instance exception."""
        event = self.create_event_in_db(create_simple_event())
        rule = RecurrenceRule.objects.create(frequency="daily", interval=1)
        event.recurrence_rule = rule
        
        exception_date = event.start_time.strftime('%Y-%m-%d')
        rule.exception_dates = [exception_date]
        rule.save()
        event.save()
        
        result = get_base_instance(event, rule)
        self.assertEqual(result, [])

    def test_should_stop_generating_past_end(self):
        """Test should stop generating past end."""
        current = datetime.now(timezone.utc)
        end_date = current - timedelta(days=1)
        rule = RecurrenceRule(frequency="daily")
        self.assertTrue(should_stop_generating(current, end_date, rule))

    def test_should_stop_generating_past_rule_end(self):
        """Test should stop generating past rule end."""
        current = datetime.now(timezone.utc)
        end_date = current + timedelta(days=10)
        rule = RecurrenceRule(frequency="daily", end_date=(current - timedelta(days=1)).date())
        self.assertTrue(should_stop_generating(current, end_date, rule))

    def test_create_recurrence_with_end_date_fixture(self):
        """Test create recurrence with end date fixture."""
        from .test_fixture_builders import create_recurrence_with_end_date
        import json
        
        rule_json = create_recurrence_with_end_date("weekly", 10)
        rule_data = json.loads(rule_json)
        
        self.assertEqual(rule_data["frequency"], "weekly")
        self.assertIn("end_date", rule_data)

    def test_create_event_invalid_recurrence_json_helper(self):
        """Test create event invalid recurrence JSON helper."""
        event_data = create_simple_event()
        event_data["recurrence_rule"] = "invalid-json"
        
        
        with self.assertRaises(TypeError):
            self.create_event_in_db(event_data)
