import re
from datetime import datetime, timedelta, timezone as dt_timezone
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

from django.utils import timezone as django_timezone
from studyFlax.models import CalendarEvent, TimetableSource

def sync_timetable(source_url, user=None):
    source_key = get_source_key(source_url)
    try:
        events = load_events(source_url, source_key)
        created, updated = upsert_events(events, user)
        update_source_status(source_url, user, True, "")
        return {"created": created, "updated": updated, "source_url": source_url}
    except Exception as exc:
        update_source_status(source_url, user, False, str(exc))
        raise

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
        match = re.search(r'(https?://[^\s"\']+\.ics[^\s"\']*)', html, re.IGNORECASE)
    return urljoin(base_url, match.group(1)) if match else None

def parse_ics_events(ics_text, source_key):
    lines = unfold_ics_lines(ics_text)
    blocks = split_event_blocks(lines)
    return [build_event_data(parse_event_block(b), source_key) for b in blocks]

def unfold_ics_lines(ics_text):
    lines = []
    for line in ics_text.splitlines():
        if line.startswith((" ", "\t")) and lines:
            lines[-1] += line[1:]
        else:
            lines.append(line.strip())
    return [line for line in lines if line]

def split_event_blocks(lines):
    blocks = []
    current = None
    for line in lines:
        if line == "BEGIN:VEVENT":
            current = []
        elif line == "END:VEVENT" and current is not None:
            blocks.append(current)
            current = None
        elif current is not None:
            current.append(line)
    return blocks

def parse_event_block(lines):
    data = {}
    for line in lines:
        key, value = parse_ics_line(line)
        if key:
            data[key] = value
    return data

def parse_ics_line(line):
    if ":" not in line:
        return None, None
    key_part, value = line.split(":", 1)
    key = key_part.split(";", 1)[0].upper()
    return key, value.strip()

def build_event_data(data, source_key):
    start = parse_ics_datetime(data.get("DTSTART"))
    end = parse_ics_datetime(data.get("DTEND"))
    uid = data.get("UID") or f"{source_key}-{data.get('DTSTART','')}-{data.get('SUMMARY','')}"
    return {
        "title": normalize_text(data.get("SUMMARY", "Untitled")),
        "description": normalize_text(data.get("DESCRIPTION", "")),
        "start_time": start,
        "end_time": end,
        "location": normalize_text(data.get("LOCATION", "")),
        "source": source_key,
        "external_id": uid,
    }

def normalize_text(value):
    if not value:
        return ""
    text = value.replace("\\n", " ").replace("\\,", ",")
    text = text.replace("\n", " ").replace("\r", " ")
    return re.sub(r"\s+", " ", text).strip()

def parse_ics_datetime(value):
    if not value:
        return None
    if len(value) == 8:
        return to_aware(datetime.strptime(value, "%Y%m%d"))
    if value.endswith("Z"):
        dt = datetime.strptime(value, "%Y%m%dT%H%M%SZ")
        return dt.replace(tzinfo=dt_timezone.utc)
    for fmt in ("%Y%m%dT%H%M%S", "%Y%m%dT%H%M"):
        try:
            return to_aware(datetime.strptime(value, fmt))
        except ValueError:
            pass
    return None

def to_aware(dt):
    if django_timezone.is_aware(dt):
        return dt
    tz = django_timezone.get_current_timezone()
    return django_timezone.make_aware(dt, tz)

def get_source_key(url):
    host = urlparse(url).netloc or "timetable"
    return host.replace("www.", "")

def upsert_events(events, user=None):
    created = updated = 0
    for data in events:
        if not data.get("start_time") or not data.get("end_time"):
            continue
        existing = find_existing_event(data["source"], data.get("external_id"), user)
        if existing:
            apply_event_updates(existing, data)
            updated += 1
        else:
            create_event(data, user)
            created += 1
    return created, updated

def find_existing_event(source, external_id, user=None):
    if not source or not external_id:
        return None
    qs = CalendarEvent.objects.filter(source=source, external_id=external_id)
    if user:
        qs = qs.filter(user=user)
    return qs.first()

def apply_event_updates(event, data):
    for field in ("title", "description", "start_time", "end_time", "location"):
        setattr(event, field, data.get(field))
    event.save()

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
    values = {"last_error": error}
    if synced:
        values["last_synced"] = django_timezone.now()
    
    defaults = values
    TimetableSource.objects.update_or_create(
        source_url=source_url, 
        user=user,
        defaults=defaults
    )
