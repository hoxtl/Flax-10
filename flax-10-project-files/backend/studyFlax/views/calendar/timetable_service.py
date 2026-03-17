"""
Service for syncing and parsing timetable events from external ICS sources.
"""

import re
from datetime import datetime, timedelta, timezone as dt_timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse, urljoin
from urllib.request import Request, urlopen
from django.db import DatabaseError
from django.utils import timezone as django_timezone
from icalendar import Calendar
from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.models.calendar.timetable_source_model import TimetableSource

class TimetableSyncError(Exception):
    """Raised when a remote timetable sync cannot be processed."""

SYNC_FAILURE_EXCEPTIONS = (ValueError, KeyError, TypeError, UnicodeDecodeError, HTTPError, URLError, DatabaseError)

def sync_timetable(source_url, user=None):
    source_key = get_source_key(source_url)
    try:
        events = load_events(source_url, source_key)
        created, updated = upsert_events(events, user)
        update_source_status(source_url, user, True, "")
        return {"created": created, "updated": updated, "source_url": source_url}
    except SYNC_FAILURE_EXCEPTIONS as exc:
        update_source_status(source_url, user, False, str(exc))
        raise TimetableSyncError("Failed to sync timetable") from exc

def sync_timetable_if_needed(user, min_interval=timedelta(hours=6)):
    if not user.is_authenticated:
        return None
    source = TimetableSource.objects.filter(user=user).first()
    if not source or not should_sync(source, min_interval):
        return None
    return sync_timetable(source.source_url, user)

def load_events(source_url, source_key):
    ics_url = resolve_ics_url(source_url)
    if not ics_url:
        raise ValueError("No .ics link found")
    return parse_ics_events(fetch_url_text(ics_url), source_key)

def should_sync(source, min_interval):
    if not source.last_synced:
        return True
    return django_timezone.now() - source.last_synced >= min_interval

def resolve_ics_url(source_url):
    if source_url.lower().endswith(".ics"):
        return source_url
    html = fetch_url_text(source_url)
    return extract_ics_url(html, source_url)

def fetch_url_text(url):
    req = Request(url, headers={"User-Agent": "Flax10TimetableSync/1.0"})
    with urlopen(req, timeout=20) as response:
        return response.read().decode("utf-8", errors="ignore")

def extract_ics_url(html, base_url):
    match = re.search(r'href="([^"]+\.ics[^"]*)"', html, re.IGNORECASE)
    if not match:
        return None
    path = match.group(1)
    return path if path.startswith("http") else urljoin(base_url, path)

def get_source_key(url):
    host = urlparse(url).netloc or "timetable"
    return host.replace("www.", "")

def parse_ics_events(ics_text, source_key):
    cal = Calendar.from_ical(ics_text)
    return [e for e in (parse_vevent(c, source_key) for c in cal.walk("VEVENT")) if e]

def parse_vevent(vevent, source_key):
    start = vevent.get("DTSTART")
    end = vevent.get("DTEND")
    if not start or not end:
        return None
    return {
        "title": str(vevent.get("SUMMARY", "Untitled")),
        "description": str(vevent.get("DESCRIPTION", "")),
        "start_time": start.dt,
        "end_time": end.dt,
        "location": str(vevent.get("LOCATION", "")),
        "source": source_key,
        "external_id": str(vevent.get("UID", "")),
    }

def try_parse_format(value, fmt):
    try:
        return to_aware(datetime.strptime(value, fmt))
    except ValueError:
        return None

def parse_ics_datetime(value):
    if not value:
        return None
    if len(value) == 8:
        return to_aware(datetime.strptime(value, "%Y%m%d"))
    if value.endswith("Z"):
        return datetime.strptime(value, "%Y%m%dT%H%M%SZ").replace(tzinfo=dt_timezone.utc)
    return try_parse_format(value, "%Y%m%dT%H%M%S") or try_parse_format(value, "%Y%m%dT%H%M")

def to_aware(dt):
    if django_timezone.is_aware(dt):
        return dt
    return django_timezone.make_aware(dt, django_timezone.get_current_timezone())

def is_valid_event(data):
    return data.get("start_time") and data.get("end_time")

def update_event_field(event, field, data):
    if field in data:
        setattr(event, field, data[field])

def apply_event_updates(event, data):
    fields = ("title", "description", "start_time", "end_time", "location")
    for field in fields:
        update_event_field(event, field, data)
    event.save()

def upsert_event(data, user):
    existing = find_existing_event(data["source"], data.get("external_id"), user)
    if existing:
        apply_event_updates(existing, data)
        return "updated"
    create_event(data, user)
    return "created"

def count_result(result, created, updated):
    if result == "updated":
        return created, updated + 1
    return created + 1, updated

def process_event(data, user, created, updated):
    if not is_valid_event(data):
        return created, updated
    return count_result(upsert_event(data, user), created, updated)

def upsert_events(events, user=None):
    created = updated = 0
    for data in events:
        created, updated = process_event(data, user, created, updated)
    return created, updated

def find_existing_event(source, external_id, user=None):
    if not source or not external_id:
        return None
    qs = CalendarEvent.objects.filter(source=source, external_id=external_id)
    if user:
        qs = qs.filter(user=user)
    return qs.first()

def create_event(data, user=None):
    CalendarEvent.objects.create(
        user=user,
        title=data.get("title", "Untitled"),
        description=data.get("description", ""),
        start_time=data.get("start_time"),
        end_time=data.get("end_time"),
        location=data.get("location"),
        source=data.get("source"),
        external_id=data.get("external_id"),
    )

def update_source_status(source_url, user, synced, error):
    defaults = {"last_error": error}
    if synced:
        defaults["last_synced"] = django_timezone.now()
    TimetableSource.objects.update_or_create(source_url=source_url, user=user, defaults=defaults)
