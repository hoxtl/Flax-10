"""
Tests for reading utilities.
"""

from datetime import timedelta

from django.utils import timezone

from studyFlax.models import Module, Reading, Task
from studyFlax.tests.helpers.test_case_support import BaseTestCase
from studyFlax.tests.helpers.test_model_builders import make_user
from studyFlax.utils.reading_utils import (
    DEFAULT_PAGE_TIME,
    estimated_blocks_per_page,
    estimated_time_reading,
    get_avg_time_per_page,
    update_estimate_blocks,
    update_reading_estimates,
)


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


class ReadingUtilsTests(BaseTestCase):
    """Tests reading utils."""
    def setUp(self):
        super().setUp()
        self.teacher = _make_teacher()
        self.module = _make_module(self.teacher)

    def test_get_avg_time_per_page_default(self):
        self.assertEqual(get_avg_time_per_page(self.user), DEFAULT_PAGE_TIME)

    def test_get_avg_time_per_page_with_reading_tasks(self):
        reading = _make_reading(self.module, start=1, end=10)
        Task.objects.create(
            user=self.user, title="R", reading=reading, module=self.module,
            completed=True, time_spent_minutes=30,
        )
        avg = get_avg_time_per_page(self.user)
        self.assertEqual(avg, 3.0)

    def test_get_avg_time_per_page_with_manual_tasks(self):
        Task.objects.create(
            user=self.user, title="M", module=self.module,
            completed=True, time_spent_minutes=20, page_count=10,
        )
        avg = get_avg_time_per_page(self.user)
        self.assertEqual(avg, 2.0)

    def test_estimated_time_reading_with_estimate(self):
        reading = _make_reading(self.module, estimated_minutes=45)
        self.assertEqual(estimated_time_reading(reading, self.user), 45)

    def test_estimated_time_reading_without_estimate(self):
        reading = _make_reading(self.module, start=1, end=10, estimated_minutes=None)
        result = estimated_time_reading(reading, self.user)
        self.assertEqual(result, round(10 * DEFAULT_PAGE_TIME))

    def test_estimated_blocks_per_page(self):
        self.assertEqual(estimated_blocks_per_page(10, 2.0), 1)
        self.assertEqual(estimated_blocks_per_page(100, 2.0), 8)
        self.assertEqual(estimated_blocks_per_page(1, 1.0), 1)

    def test_update_estimate_blocks_changes(self):
        reading = _make_reading(self.module, start=1, end=10)
        task = Task.objects.create(
            user=self.user, title="T", reading=reading, module=self.module,
            estimated_blocks=1,
        )
        update_estimate_blocks(task, 5)
        task.refresh_from_db()
        self.assertEqual(task.estimated_blocks, 5)

    def test_update_estimate_blocks_no_change(self):
        reading = _make_reading(self.module, start=1, end=10)
        task = Task.objects.create(
            user=self.user, title="T", reading=reading, module=self.module,
            estimated_blocks=3,
        )
        update_estimate_blocks(task, 3)
        task.refresh_from_db()
        self.assertEqual(task.estimated_blocks, 3)

    def test_update_reading_estimates(self):
        reading = _make_reading(self.module, start=1, end=10)
        task = Task.objects.create(
            user=self.user, title="T", reading=reading, module=self.module,
            estimated_blocks=1, completed=False,
        )
        manual_task = Task.objects.create(
            user=self.user, title="M", module=self.module,
            estimated_blocks=1, completed=False, page_count=50,
        )
        update_reading_estimates(self.user)
        task.refresh_from_db()
        manual_task.refresh_from_db()
        expected_reading = estimated_blocks_per_page(10, DEFAULT_PAGE_TIME)
        expected_manual = estimated_blocks_per_page(50, DEFAULT_PAGE_TIME)
        self.assertEqual(task.estimated_blocks, expected_reading)
        self.assertEqual(manual_task.estimated_blocks, expected_manual)
