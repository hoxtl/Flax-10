<<<<<<< HEAD
"""
Tests for groupwork fixtures.
"""

from studyFlax.fixtures.groupwork.groupwork_fixtures import (
    GROUP_PROJECT_FIXTURES,
    GROUP_TASK_TEMPLATES,
)
from studyFlax.tests.helpers.test_case_support import BaseTestCase


class GroupworkFixturesTests(BaseTestCase):
    """Tests groupwork fixtures."""
=======
from studyFlax.fixtures.groupwork_fixtures import (
    GROUP_PROJECT_FIXTURES,
    GROUP_TASK_TEMPLATES,
)
from studyFlax.tests.helpers.base import BaseTestCase


class GroupworkFixturesTests(BaseTestCase):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    def test_fixtures_are_defined(self):
        self.assertGreater(len(GROUP_PROJECT_FIXTURES), 0)
        self.assertGreater(len(GROUP_TASK_TEMPLATES), 0)
        self.assertEqual(len(GROUP_PROJECT_FIXTURES[0]), 3)
        self.assertEqual(len(GROUP_TASK_TEMPLATES[0]), 4)
