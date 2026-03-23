from django.test import SimpleTestCase

from studyFlax.management.commands.seed_support.helpers import CORE_WIDGETS, _select_widgets


class SeedHomepageWidgetsTests(SimpleTestCase):
    def test_select_widgets_returns_only_core_widgets(self):
        self.assertEqual(CORE_WIDGETS, ["deadlines", "todayTasks", "bigTimeline"])
        self.assertEqual(_select_widgets(), CORE_WIDGETS)
