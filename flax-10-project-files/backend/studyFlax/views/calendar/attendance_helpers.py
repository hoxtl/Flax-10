"""Helpers for attendance views. Single responsibility: data lookup and stats building."""

from collections import defaultdict

from rest_framework import status
from rest_framework.response import Response

from studyFlax.models import CalendarEvent


def _validate_event_for_attendance(user, event_id):
    """Return (event, None) on success or (None, detail_string) on failure."""
    if event_id is None:
        return None, "event_id is required"
    try:
        event = CalendarEvent.objects.get(pk=event_id, user=user)
    except CalendarEvent.DoesNotExist:
        return None, "Event not found or not yours."
    if not event.source or not event.external_id:
        return None, "Only timetable events can have attendance recorded."
    return event, None


def get_event_for_attendance(user, event_id):
    """Resolve and validate event; return (event, None) or (None, error_response)."""
    event, detail = _validate_event_for_attendance(user, event_id)
    if detail is not None:
        code = status.HTTP_404_NOT_FOUND if "not found" in detail else status.HTTP_400_BAD_REQUEST
        return None, Response({"detail": detail}, status=code)
    return event, None


def build_attendance_stats(records):
    """Build overall and by_type stats from attendance records. One responsibility: aggregate."""
    attended_total = 0
    missed_total = 0
    by_type = defaultdict(lambda: {"attended": 0, "missed": 0})
    for r in records:
        name = getattr(getattr(r.event, "tag", None), "name", None) if getattr(r, "event", None) else None
        event_type = (name or "Other").strip()
        if r.attended:
            attended_total += 1
            by_type[event_type]["attended"] += 1
        else:
            missed_total += 1
            by_type[event_type]["missed"] += 1
    return {
        "overall": {"attended": attended_total, "missed": missed_total},
        "by_type": dict(by_type),
    }
