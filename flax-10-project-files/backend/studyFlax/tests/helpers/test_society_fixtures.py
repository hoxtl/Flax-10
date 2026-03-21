"""
Backend tests for society fixtures.
"""

from datetime import date

from django.test import TestCase

<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
class SocietyFixturesTest(TestCase):
    """Tests for society fixtures."""

    def test_get_events_for_category_sports(self):
<<<<<<< HEAD
        from studyFlax.fixtures.societies.society_fixtures import get_events_for_category
=======
        from studyFlax.fixtures.society_fixtures import get_events_for_category
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

        events = get_events_for_category("sports")
        self.assertIsInstance(events, list)
        self.assertGreater(len(events), 0)

    def test_get_events_for_unknown_category(self):
<<<<<<< HEAD
        from studyFlax.fixtures.societies.society_fixtures import get_events_for_category
=======
        from studyFlax.fixtures.society_fixtures import get_events_for_category
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

        events = get_events_for_category("unknown_category")
        self.assertIsInstance(events, list)
        self.assertGreater(len(events), 0)

    def test_build_society_seed_data(self):
<<<<<<< HEAD
        from studyFlax.fixtures.societies.society_fixtures import build_society_seed_data
=======
        from studyFlax.fixtures.society_fixtures import build_society_seed_data
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

        data = build_society_seed_data()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        self.assertIn("name", data[0])
        self.assertIn("categories", data[0])
        self.assertIn("events", data[0])

    def test_build_society_dict(self):
<<<<<<< HEAD
        from studyFlax.fixtures.societies.society_fixtures import build_society_dict
=======
        from studyFlax.fixtures.society_fixtures import build_society_dict
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

        result = build_society_dict("Test", "Bio", "About", "sports", ["Tag1"])
        self.assertEqual(result["name"], "Test")
        self.assertIn("sports", result["categories"])
<<<<<<< HEAD
        self.assertGreater(len(result["about"]), 80)
        self.assertIn("\n\n", result["about"])

    def test_get_random_category_image(self):
        from studyFlax.fixtures.societies.society_fixtures import get_random_category_image
=======

    def test_get_random_category_image(self):
        from studyFlax.fixtures.society_fixtures import get_random_category_image
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

        image = get_random_category_image("sports")
        self.assertIsInstance(image, str)
        self.assertTrue(image.endswith(".jpg"))

    def test_get_random_category_image_mapped(self):
<<<<<<< HEAD
        from studyFlax.fixtures.societies.society_fixtures import get_random_category_image
=======
        from studyFlax.fixtures.society_fixtures import get_random_category_image
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

        self.assertIsInstance(get_random_category_image("gaming"), str)

    def test_build_event_datetime(self):
<<<<<<< HEAD
        from studyFlax.fixtures.societies.society_fixtures import build_event_datetime
=======
        from studyFlax.fixtures.society_fixtures import build_event_datetime
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

        start, end = build_event_datetime(18, 90, day_of_week=2)
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)
        self.assertEqual((end - start).seconds // 60, 90)

    def test_build_event_datetime_no_day(self):
<<<<<<< HEAD
        from studyFlax.fixtures.societies.society_fixtures import build_event_datetime
=======
        from studyFlax.fixtures.society_fixtures import build_event_datetime
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

        start, end = build_event_datetime(10, 60, day_of_week=None)
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)

    def test_get_next_occurrence(self):
<<<<<<< HEAD
        from studyFlax.fixtures.societies.society_fixtures import get_next_occurrence
=======
        from studyFlax.fixtures.society_fixtures import get_next_occurrence
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

        self.assertIsInstance(get_next_occurrence(0), date)

    def test_get_next_occurrence_no_day(self):
<<<<<<< HEAD
        from studyFlax.fixtures.societies.society_fixtures import get_next_occurrence

        self.assertIsNotNone(get_next_occurrence(None))
=======
        from studyFlax.fixtures.society_fixtures import get_next_occurrence

        self.assertIsNotNone(get_next_occurrence(None))

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
