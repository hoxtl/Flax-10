<<<<<<< HEAD
"""
Tests for the event map view.
"""

from unittest.mock import patch
from datetime import datetime, timedelta, timezone
from studyFlax.tests.helpers.test_case_support import BaseTestCase
=======
from unittest.mock import patch
from datetime import datetime, timedelta, timezone
from studyFlax.tests.helpers.base import BaseTestCase
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
from studyFlax.models import CalendarEvent


class EventMapViewTests(BaseTestCase):
<<<<<<< HEAD
    """Tests event map view."""
=======

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    def _create_map_event(self, **overrides):
        now = datetime.now(timezone.utc)
        defaults = {
            "user": self.user,
            "title": "Map Event",
            "start_time": now,
            "end_time": now + timedelta(hours=2),
            "location": "Building A",
            "location_validated": True,
            "location_latitude": 51.5074,
            "location_longitude": -0.1278,
        }
        defaults.update(overrides)
        return CalendarEvent.objects.create(**defaults)

    def test_no_events_returns_empty(self):
        response = self.client.get("/api/calendar/events/map/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["events"], [])

    def test_returns_validated_event_today(self):
        event = self._create_map_event()
        response = self.client.get("/api/calendar/events/map/")
        self.assertEqual(response.status_code, 200)
        events = response.json()["events"]
        self.assertEqual(len(events), 1)
        data = events[0]
        self.assertEqual(data["id"], event.id)
        self.assertEqual(data["title"], "Map Event")
        self.assertEqual(data["location"], "Building A")
        self.assertEqual(data["latitude"], 51.5074)
        self.assertEqual(data["longitude"], -0.1278)
        self.assertIn("start_time", data)
        self.assertIn("end_time", data)
        self.assertIn("priority", data)

    def test_non_validated_event_excluded(self):
        self._create_map_event(location_validated=False)
        response = self.client.get("/api/calendar/events/map/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["events"], [])

    def test_event_without_coords_excluded(self):
        self._create_map_event(location_latitude=None, location_longitude=None)
        response = self.client.get("/api/calendar/events/map/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["events"], [])

    def test_past_event_excluded(self):
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        self._create_map_event(
            start_time=yesterday,
            end_time=yesterday + timedelta(hours=1),
        )
        response = self.client.get("/api/calendar/events/map/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["events"], [])
