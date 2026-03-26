"""
Tests for reading models.
"""

from datetime import timedelta

from django.utils import timezone

from studyFlax.models import Module, Reading
from studyFlax.tests.helpers.test_case_support import BaseTestCase
from studyFlax.tests.helpers.test_model_builders import make_user


def _make_teacher():
    user = make_user("teacher", "teacher@e.com")
    user.role = "teacher"
    user.save(update_fields=["role"])
    return user

def _make_module(teacher):
    now = timezone.now()
    return Module.objects.create(
        module_code="CS101",
        module_name="Intro CS",
        created_by=teacher,
        start_time=now,
        end_time=now + timedelta(hours=1),
    )

def _make_reading(module, title="Chapter 1", start=1, end=20, deadline=None, estimated_minutes=None):
    return Reading.objects.create(
        module=module,
        title=title,
        start_page=start,
        end_page=end,
        deadline=deadline or timezone.now() + timedelta(days=7),
        estimated_minutes=estimated_minutes,
    )


class ReadingModelTests(BaseTestCase):
    """Tests reading model."""
    def test_page_count(self):
        teacher = _make_teacher()
        module = _make_module(teacher)
        reading = _make_reading(module, start=10, end=30)
        self.assertEqual(reading.page_count(), 21)

    def test_str(self):
        teacher = _make_teacher()
        module = _make_module(teacher)
        reading = _make_reading(module, title="Data Structures")
        self.assertIn("CS101", str(reading))
        self.assertIn("Data Structures", str(reading))
