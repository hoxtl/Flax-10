"""
Tests for reading serialisers.
"""

from datetime import timedelta

from django.utils import timezone
from rest_framework import status

from studyFlax.models import Module, Reading
from studyFlax.tests.helpers.test_case_support import BaseTestCase
from studyFlax.tests.helpers.test_model_builders import make_user
from studyFlax.serialisers.modules.reading_serialisers import ReadingSummarySerialiser


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


class ReadingSerialiserTests(BaseTestCase):
    """Tests reading serialiser."""
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

    def test_validate_requires_teacher(self):
        self.teacher.role = 'student'
        self.teacher.save(update_fields=['role'])
        self.client.force_authenticate(user=self.teacher)
        payload = {
            "title": "Blocked",
            "start_page": 1,
            "end_page": 2,
            "deadline": (timezone.now() + timedelta(days=5)).isoformat(),
        }
        res = self.client.post(
            f"/api/modules/{self.module.id}/readings/", payload, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_end_page_after_start(self):
        payload = {
            "title": "Bad Range",
            "start_page": 10,
            "end_page": 5,
            "deadline": (timezone.now() + timedelta(days=5)).isoformat(),
        }
        res = self.client.post(
            f"/api/modules/{self.module.id}/readings/", payload, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class ReadingSummarySerialiserTest(BaseTestCase):
    """Tests reading summary serialiser."""
    def test_summary_page_count(self):
        teacher = _make_teacher()
        module = _make_module(teacher)
        reading = _make_reading(module, start=5, end=15)
        serialiser = ReadingSummarySerialiser(reading)
        self.assertEqual(serialiser.data["page_count"], 11)
