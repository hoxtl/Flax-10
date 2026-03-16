"""
Helpers for attendance views.
"""

from collections import defaultdict

from rest_framework import status
from rest_framework.response import Response

from studyFlax.models import CalendarEvent

def _normalize_event_type(name):
    """Map tag name to display type: Small group, Lecture, Practical/lab, Other."""
    if not name or not isinstance(name, str):
        return "Other"
    lower = name.lower().strip()
    if "lecture" in lower or "lgt" in lower:
        return "Lecture"
    if "small group" in lower or lower == "smg":
        return "Small group"
    if "practical" in lower or "lab" in lower:
        return "Practical/lab"
    return "Other"

def _infer_type_from_title_and_desc(event):
    """Infer type from title/description only (Briefing=other, then LGT=lecture, SmG=small group)."""
    title = (getattr(event, "title", None) or "") or ""
    desc = (getattr(event, "description", None) or "") or ""
    combined = f"{title} {desc}".lower()
    if "briefing" in combined:
        return "Other"
    if "lecture" in combined or "lgt" in combined:
        return "Lecture"
    if "smg" in combined or "small group" in combined:
        return "Small group"
    if "practical" in combined or "lab" in combined:
        return "Practical/lab"
    return None

def _event_type_from_record(record):
    """Derive display type: title/description first, then tag."""
    event = getattr(record, "event", None)
    if not event:
        return "Other"
    from_title = _infer_type_from_title_and_desc(event)
    if from_title is not None:
        return from_title
    tag_name = getattr(getattr(event, "tag", None), "name", None) or ""
    return _normalize_event_type(tag_name)

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

def _tally_record(r, by_type):
    event_type = _event_type_from_record(r)
    key = "attended" if r.attended else "missed"
    by_type[event_type][key] += 1
    return 1 if r.attended else 0

def build_attendance_stats(records):
    by_type = defaultdict(lambda: {"attended": 0, "missed": 0})
    record_list = list(records)
    attended = sum(_tally_record(r, by_type) for r in record_list)
    return {
        "overall": {"attended": attended, "missed": len(record_list) - attended},
        "by_type": dict(by_type),
    }
