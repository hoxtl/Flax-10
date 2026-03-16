"""
Shared base classes and assertion helpers for backend tests.
"""

from studyFlax.models import CalendarEvent, RecurrenceRule, Tag
from .fixtures import get_sample_tags
from rest_framework.test import APIClient
from django.test import TestCase

class BaseTestCase(TestCase):
    """Base test case with common setup."""

    def setUp(self):
        from studyFlax.models import User

        self.user = User.objects.create(
            email="test@example.com",
            password="password",
            first_name="Test",
            last_name="User",
        )
        self.create_sample_tags()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def create_sample_tags(self):
        for tag_data in get_sample_tags():
            Tag.objects.create(**tag_data, is_default=True)

    def get_tag_by_name(self, name):
        return Tag.objects.get(name=name)

class BaseEventTestCase(BaseTestCase):
    """Base test case for event tests."""

    def setUp(self):
        super().setUp()
        self.url = "/api/events/"

    def assert_event_response(self, response, expected_status):
        self.assertEqual(response.status_code, expected_status)

    def assert_event_data(self, event, expected):
        self.assertEqual(event["title"], expected["title"])
        if "description" in expected:
            self.assertEqual(event["description"], expected["description"])

    def create_event_in_db(self, event_data, user=None):
        user = user or self.user
        tag_id = event_data.pop("tag", None)
        rule = self._create_recurrence(event_data.pop("recurrence_rule", None))
        self._parse_event_dates(event_data)
        event = CalendarEvent.objects.create(
            recurrence_rule=rule, user=user, **event_data
        )
        if tag_id:
            event.tag_id = tag_id
            event.save()
        return event

    def _create_recurrence(self, data):
        if not data:
            return None
        if isinstance(data, str):
            import json

            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                pass
        return RecurrenceRule.objects.create(**data)

    def _parse_event_dates(self, data):
        from datetime import datetime

        for field in ["start_time", "end_time"]:
            if isinstance(data.get(field), str):
                data[field] = datetime.fromisoformat(
                    data[field].replace("Z", "+00:00")
                )

