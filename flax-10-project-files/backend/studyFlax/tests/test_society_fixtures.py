"""
Backend tests for society fixtures.
"""

from datetime import date

from django.test import TestCase

class SocietyFixturesTest(TestCase):
    """Tests for society fixtures."""
    def test_get_events_for_category_sports(self):
        from studyFlax.fixtures.society_fixtures import get_events_for_category

        events = get_events_for_category('sports')
        self.assertIsInstance(events, list)
        self.assertGreater(len(events), 0)

    def test_get_events_for_unknown_category(self):
        from studyFlax.fixtures.society_fixtures import get_events_for_category

        events = get_events_for_category('unknown_category')
        self.assertIsInstance(events, list)
        self.assertGreater(len(events), 0)

    def test_build_society_seed_data(self):
        from studyFlax.fixtures.society_fixtures import build_society_seed_data

        data = build_society_seed_data()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertIn('name', data[0])
        self.assertIn('categories', data[0])
        self.assertIn('events', data[0])

    def test_build_society_dict(self):
        from studyFlax.fixtures.society_fixtures import build_society_dict

        result = build_society_dict('Test', 'Bio', 'About', 'sports', ['Tag1'])
        self.assertEqual(result['name'], 'Test')
        self.assertIn('sports', result['categories'])

    def test_get_random_category_image(self):
        from studyFlax.fixtures.society_fixtures import get_random_category_image

        image = get_random_category_image('sports')
        self.assertIsInstance(image, str)
        self.assertTrue(image.endswith('.jpg'))

    def test_get_random_category_image_mapped(self):
        from studyFlax.fixtures.society_fixtures import get_random_category_image

        self.assertIsInstance(get_random_category_image('gaming'), str)

    def test_build_event_datetime(self):
        from studyFlax.fixtures.society_fixtures import build_event_datetime

        start, end = build_event_datetime(18, 90, day_of_week=2)
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)
        self.assertEqual((end - start).seconds // 60, 90)

    def test_build_event_datetime_no_day(self):
        from studyFlax.fixtures.society_fixtures import build_event_datetime

        start, end = build_event_datetime(10, 60, day_of_week=None)
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)

    def test_get_next_occurrence(self):
        from studyFlax.fixtures.society_fixtures import get_next_occurrence

        self.assertIsInstance(get_next_occurrence(0), date)

    def test_get_next_occurrence_no_day(self):
        from studyFlax.fixtures.society_fixtures import get_next_occurrence

        self.assertIsNotNone(get_next_occurrence(None))
