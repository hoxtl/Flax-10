from unittest.mock import patch, MagicMock
from django.db import DatabaseError
from studyFlax.tests.helpers.base import BaseTestCase
from studyFlax.models import CalendarEvent, EventAttendance, Tag
from studyFlax.views.calendar.attendance_helpers import (
    _normalize_event_type,
    _infer_type_from_title_and_desc,
    _event_type_from_record,
    build_attendance_stats,
)
from datetime import datetime, timedelta, timezone


class AttendanceViewTests(BaseTestCase):

    def _create_timetable_event(self, **overrides):
        defaults = {
            "user": self.user,
            "title": "Lecture 1",
            "start_time": datetime.now(timezone.utc),
            "end_time": datetime.now(timezone.utc) + timedelta(hours=1),
            "source": "timetable",
            "external_id": "ext-001",
        }
        defaults.update(overrides)
        return CalendarEvent.objects.create(**defaults)

    def _create_manual_event(self, **overrides):
        defaults = {
            "user": self.user,
            "title": "Manual Event",
            "start_time": datetime.now(timezone.utc),
            "end_time": datetime.now(timezone.utc) + timedelta(hours=1),
            "source": None,
            "external_id": None,
        }
        defaults.update(overrides)
        return CalendarEvent.objects.create(**defaults)

    def test_record_attendance_creates_new_record(self):
        event = self._create_timetable_event()
        response = self.client.post(
            "/api/attendance/record/",
            {"event_id": event.id, "attended": True},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["created"])
        self.assertTrue(data["attended"])
        self.assertEqual(data["event_id"], event.id)

    def test_record_attendance_updates_existing(self):
        event = self._create_timetable_event()
        self.client.post("/api/attendance/record/", {"event_id": event.id, "attended": True}, format="json")
        response = self.client.post(
            "/api/attendance/record/",
            {"event_id": event.id, "attended": False},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["created"])
        self.assertFalse(data["attended"])

    def test_record_attendance_missing_event_id(self):
        response = self.client.post("/api/attendance/record/", {})
        self.assertEqual(response.status_code, 400)
        self.assertIn("event_id is required", response.json()["detail"])

    def test_record_attendance_nonexistent_event(self):
        response = self.client.post("/api/attendance/record/", {"event_id": 99999})
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"])

    def test_record_attendance_manual_event_rejected(self):
        event = self._create_manual_event()
        response = self.client.post("/api/attendance/record/", {"event_id": event.id})
        self.assertEqual(response.status_code, 400)
        self.assertIn("timetable", response.json()["detail"])

    def test_record_attendance_defaults_attended_true(self):
        event = self._create_timetable_event()
        response = self.client.post("/api/attendance/record/", {"event_id": event.id})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["attended"])

    def test_attendance_stats_empty(self):
        response = self.client.get("/api/attendance/stats/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["overall"]["attended"], 0)
        self.assertEqual(data["overall"]["missed"], 0)

    def test_attendance_stats_with_records(self):
        e1 = self._create_timetable_event(title="Lecture A")
        e2 = self._create_timetable_event(title="Lecture B", external_id="ext-002")
        EventAttendance.objects.create(user=self.user, event=e1, attended=True)
        EventAttendance.objects.create(user=self.user, event=e2, attended=False)
        response = self.client.get("/api/attendance/stats/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["overall"]["attended"], 1)
        self.assertEqual(data["overall"]["missed"], 1)

    @patch("studyFlax.views.calendar.attendance_view.EventAttendance.objects")
    def test_attendance_stats_database_error(self, mock_objects):
        mock_objects.filter.return_value.select_related.side_effect = DatabaseError("boom")
        response = self.client.get("/api/attendance/stats/")
        self.assertEqual(response.status_code, 500)
        self.assertIn("unavailable", response.json()["detail"])

    def test_attendance_records_empty(self):
        response = self.client.get("/api/attendance/records/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_attendance_records_with_data(self):
        event = self._create_timetable_event()
        EventAttendance.objects.create(user=self.user, event=event, attended=True)
        response = self.client.get("/api/attendance/records/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["event_id"], event.id)
        self.assertTrue(data[0]["attended"])

    @patch("studyFlax.views.calendar.attendance_view.EventAttendance.objects")
    def test_attendance_records_database_error(self, mock_objects):
        mock_objects.filter.return_value.select_related.side_effect = DatabaseError("boom")
        response = self.client.get("/api/attendance/records/")
        self.assertEqual(response.status_code, 500)
        self.assertIn("unavailable", response.json()["detail"])


class NormalizeEventTypeTests(BaseTestCase):

    def test_none_returns_other(self):
        self.assertEqual(_normalize_event_type(None), "Other")

    def test_empty_string_returns_other(self):
        self.assertEqual(_normalize_event_type(""), "Other")

    def test_non_string_returns_other(self):
        self.assertEqual(_normalize_event_type(123), "Other")

    def test_lecture(self):
        self.assertEqual(_normalize_event_type("Lecture"), "Lecture")

    def test_lgt(self):
        self.assertEqual(_normalize_event_type("LGT"), "Lecture")

    def test_small_group(self):
        self.assertEqual(_normalize_event_type("Small group"), "Small group")

    def test_smg(self):
        self.assertEqual(_normalize_event_type("smg"), "Small group")

    def test_practical(self):
        self.assertEqual(_normalize_event_type("Practical"), "Practical/lab")

    def test_lab(self):
        self.assertEqual(_normalize_event_type("Lab session"), "Practical/lab")

    def test_random_string(self):
        self.assertEqual(_normalize_event_type("Workshop"), "Other")


class InferTypeFromTitleAndDescTests(BaseTestCase):

    def _make_event(self, title="", description=""):
        mock = MagicMock()
        mock.title = title
        mock.description = description
        return mock

    def test_briefing_returns_other(self):
        self.assertEqual(_infer_type_from_title_and_desc(self._make_event(title="Briefing session")), "Other")

    def test_lecture_in_title(self):
        self.assertEqual(_infer_type_from_title_and_desc(self._make_event(title="Lecture 1")), "Lecture")

    def test_lgt_in_description(self):
        self.assertEqual(_infer_type_from_title_and_desc(self._make_event(description="LGT topic")), "Lecture")

    def test_smg_in_title(self):
        self.assertEqual(_infer_type_from_title_and_desc(self._make_event(title="SMG session")), "Small group")

    def test_small_group_in_desc(self):
        self.assertEqual(_infer_type_from_title_and_desc(self._make_event(description="Small group tutorial")), "Small group")

    def test_practical_in_title(self):
        self.assertEqual(_infer_type_from_title_and_desc(self._make_event(title="Practical class")), "Practical/lab")

    def test_lab_in_title(self):
        self.assertEqual(_infer_type_from_title_and_desc(self._make_event(title="Lab work")), "Practical/lab")

    def test_no_match(self):
        self.assertIsNone(_infer_type_from_title_and_desc(self._make_event(title="Meeting")))

    def test_none_title_and_desc(self):
        mock = MagicMock()
        mock.title = None
        mock.description = None
        self.assertIsNone(_infer_type_from_title_and_desc(mock))


class EventTypeFromRecordTests(BaseTestCase):

    def test_no_event_attr(self):
        record = MagicMock(spec=[])
        self.assertEqual(_event_type_from_record(record), "Other")

    def test_title_match_takes_priority(self):
        event = MagicMock()
        event.title = "Lecture 1"
        event.description = ""
        tag = MagicMock()
        tag.name = "Practical"
        event.tag = tag
        record = MagicMock()
        record.event = event
        self.assertEqual(_event_type_from_record(record), "Lecture")

    def test_tag_fallback(self):
        event = MagicMock()
        event.title = "Session"
        event.description = ""
        tag = MagicMock()
        tag.name = "Lab session"
        event.tag = tag
        record = MagicMock()
        record.event = event
        self.assertEqual(_event_type_from_record(record), "Practical/lab")

    def test_no_tag_returns_other(self):
        event = MagicMock()
        event.title = "Session"
        event.description = ""
        event.tag = None
        record = MagicMock()
        record.event = event
        self.assertEqual(_event_type_from_record(record), "Other")


class BuildAttendanceStatsTests(BaseTestCase):

    def test_empty_records(self):
        result = build_attendance_stats([])
        self.assertEqual(result["overall"], {"attended": 0, "missed": 0})
        self.assertEqual(result["by_type"], {})

    def test_mixed_records(self):
        r1 = MagicMock()
        r1.attended = True
        r1.event = MagicMock()
        r1.event.title = "Lecture 1"
        r1.event.description = ""
        r1.event.tag = None

        r2 = MagicMock()
        r2.attended = False
        r2.event = MagicMock()
        r2.event.title = "Lecture 2"
        r2.event.description = ""
        r2.event.tag = None

        result = build_attendance_stats([r1, r2])
        self.assertEqual(result["overall"]["attended"], 1)
        self.assertEqual(result["overall"]["missed"], 1)
        self.assertEqual(result["by_type"]["Lecture"]["attended"], 1)
        self.assertEqual(result["by_type"]["Lecture"]["missed"], 1)
