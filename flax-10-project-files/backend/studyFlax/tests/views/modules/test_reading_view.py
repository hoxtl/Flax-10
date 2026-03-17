"""Tests for reading views, serialisers, utils, and model."""

import math
from datetime import timedelta

from django.utils import timezone
from rest_framework import status

from studyFlax.models import Module, Reading, Task, Enrollment
from studyFlax.models.tasks.taskModel import TaskList
from studyFlax.tests.helpers.base import BaseTestCase
from studyFlax.tests.helpers.factories import make_user
from studyFlax.utils.reading_utils import (
    DEFAULT_PAGE_TIME,
    MINUTES_PER_BLOCK,
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


class ReadingModelTests(BaseTestCase):
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


class ReadingListViewTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.teacher = _make_teacher()
        self.module = _make_module(self.teacher)
        self.client.force_authenticate(user=self.teacher)

    def test_get_readings(self):
        _make_reading(self.module)
        res = self.client.get(f"/api/modules/{self.module.id}/readings/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_create_reading(self):
        payload = {
            "title": "New Reading",
            "start_page": 1,
            "end_page": 50,
            "deadline": (timezone.now() + timedelta(days=5)).isoformat(),
        }
        res = self.client.post(
            f"/api/modules/{self.module.id}/readings/", payload, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["title"], "New Reading")
        self.assertEqual(res.data["page_count"], 50)

    def test_create_reading_invalid(self):
        res = self.client.post(
            f"/api/modules/{self.module.id}/readings/", {}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_reading_end_before_start(self):
        payload = {
            "title": "Bad Range",
            "start_page": 50,
            "end_page": 10,
            "deadline": (timezone.now() + timedelta(days=5)).isoformat(),
        }
        res = self.client.post(
            f"/api/modules/{self.module.id}/readings/", payload, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_teacher_cannot_create_reading(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "title": "Blocked",
            "start_page": 1,
            "end_page": 10,
            "deadline": (timezone.now() + timedelta(days=5)).isoformat(),
        }
        res = self.client.post(
            f"/api/modules/{self.module.id}/readings/", payload, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class ReadingDetailViewTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.teacher = _make_teacher()
        self.module = _make_module(self.teacher)
        self.reading = _make_reading(self.module)
        self.client.force_authenticate(user=self.teacher)

    def test_get_reading(self):
        res = self.client.get(
            f"/api/modules/{self.module.id}/readings/{self.reading.id}/"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], self.reading.title)

    def test_update_reading(self):
        res = self.client.put(
            f"/api/modules/{self.module.id}/readings/{self.reading.id}/",
            {"title": "Updated Title", "start_page": 5, "end_page": 25},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], "Updated Title")

    def test_update_reading_invalid(self):
        res = self.client.put(
            f"/api/modules/{self.module.id}/readings/{self.reading.id}/",
            {"start_page": 100, "end_page": 5},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_reading(self):
        res = self.client.delete(
            f"/api/modules/{self.module.id}/readings/{self.reading.id}/"
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Reading.objects.filter(id=self.reading.id).exists())


class LoadTaskViewTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.teacher = _make_teacher()
        self.module = _make_module(self.teacher)
        self.reading = _make_reading(self.module, title="Load Me", start=1, end=10)

    def test_load_task_creates_task(self):
        res = self.client.post(f"/api/readings/{self.reading.id}/load-task/")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["title"], "Load Me")
        self.assertIn("estimated_blocks", res.data)
        self.assertEqual(res.data["page_count"], 10)
        self.assertEqual(res.data["reading_id"], self.reading.id)

    def test_load_task_with_reading_list(self):
        TaskList.objects.create(user=self.user, name="My Reading List")
        res = self.client.post(f"/api/readings/{self.reading.id}/load-task/")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(res.data["task_list"])

    def test_load_task_with_chapter(self):
        reading = _make_reading(self.module, title="With Chapter", start=1, end=5)
        reading.chapter = "Chapter 3"
        reading.save()
        res = self.client.post(f"/api/readings/{reading.id}/load-task/")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        task = Task.objects.get(id=res.data["id"])
        self.assertIn("Chapter 3", task.description)


class SuggestedReadingsViewTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.teacher = _make_teacher()
        self.module = _make_module(self.teacher)
        Enrollment.objects.create(student=self.user, module=self.module)

    def test_returns_suggested_readings(self):
        _make_reading(self.module, title="Suggested")
        res = self.client.get("/api/readings/suggested/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["title"], "Suggested")

    def test_excludes_already_loaded_readings(self):
        reading = _make_reading(self.module, title="Already Added")
        Task.objects.create(
            user=self.user, title=reading.title, reading=reading, module=self.module
        )
        res = self.client.get("/api/readings/suggested/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)


class ReadingSpeedViewTests(BaseTestCase):
    def test_default_speed_no_tasks(self):
        res = self.client.get("/api/readings/speed/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["avg_min_per_page"], DEFAULT_PAGE_TIME)
        self.assertFalse(res.data["is_personalised"])

    def test_personalised_speed(self):
        teacher = _make_teacher()
        module = _make_module(teacher)
        reading = _make_reading(module, start=1, end=10)
        Task.objects.create(
            user=self.user,
            title="Done",
            reading=reading,
            module=module,
            completed=True,
            time_spent_minutes=50,
        )
        res = self.client.get("/api/readings/speed/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertNotEqual(res.data["avg_min_per_page"], DEFAULT_PAGE_TIME)
        self.assertTrue(res.data["is_personalised"])


class ReadingUtilsTests(BaseTestCase):
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


class ReadingSerialiserTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.teacher = _make_teacher()
        self.module = _make_module(self.teacher)
        self.client.force_authenticate(user=self.teacher)

    def test_validate_chapter_negative(self):
        payload = {
            "title": "Bad Chapter",
            "chapter": "-3",
            "start_page": 1,
            "end_page": 10,
            "deadline": (timezone.now() + timedelta(days=5)).isoformat(),
        }
        res = self.client.post(
            f"/api/modules/{self.module.id}/readings/", payload, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duration_minutes_in_response(self):
        _make_reading(self.module, title="Duration Test", start=1, end=10)
        res = self.client.get(f"/api/modules/{self.module.id}/readings/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("duration_minutes", res.data[0])

    def test_page_count_in_response(self):
        _make_reading(self.module, title="PageCount", start=5, end=15)
        res = self.client.get(f"/api/modules/{self.module.id}/readings/")
        self.assertEqual(res.data[0]["page_count"], 11)

    def test_validate_chapter_valid_passes(self):
        payload = {
            "title": "Good Chapter",
            "chapter": "3",
            "start_page": 1,
            "end_page": 10,
            "deadline": (timezone.now() + timedelta(days=5)).isoformat(),
        }
        res = self.client.post(
            f"/api/modules/{self.module.id}/readings/", payload, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)


class ReadingSummarySerialiserTest(BaseTestCase):
    """Test ReadingSummarySerialiser.get_page_count."""

    def test_summary_page_count(self):
        from studyFlax.serialisers.modules.reading_serialisers import ReadingSummarySerialiser
        teacher = _make_teacher()
        module = _make_module(teacher)
        reading = _make_reading(module, start=5, end=15)
        serialiser = ReadingSummarySerialiser(reading)
        self.assertEqual(serialiser.data['page_count'], 11)
