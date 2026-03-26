"""
Shared fixture builders and sample payloads for backend tests.
"""

from datetime import datetime, timedelta, timezone


def get_datetime_str(hours_offset=0, days_offset=0):
    """Generate ISO datetime string with offset."""
    dt = datetime.now(timezone.utc) + timedelta(
        hours=hours_offset, days=days_offset
    )
    return dt.isoformat().replace("+00:00", "Z")

def create_simple_event(title="Test Event", duration_hours=1):
    return {
        "title": title,
        "description": "Test description",
        "start_time": get_datetime_str(),
        "end_time": get_datetime_str(hours_offset=duration_hours),
        "location": "Test Location",
    }

def create_minimal_event(title="Minimal Event"):
    return {
        "title": title,
        "start_time": get_datetime_str(),
        "end_time": get_datetime_str(hours_offset=1),
    }

def create_recurring_event(frequency="daily", count=5):
    import json

    return {
        **create_simple_event("Recurring Event"),
        "recurrence_rule": json.dumps(
            {"frequency": frequency, "interval": 1, "count": count}
        ),
    }

def create_recurrence_with_end_date(frequency="weekly", days=14):
    import json

    return json.dumps(
        {
            "frequency": frequency,
            "interval": 1,
            "end_date": get_datetime_str(days_offset=days),
        }
    )

def create_tag_data(name="study"):
    return {"name": name, "color": "#34D399", "default_duration": 60}
SAMPLE_TAGS = ["study", "class", "travel", "task", "other"]

def get_sample_tags():
    colors = ["#34D399", "#A78BFA", "#60A5FA", "#FBBF24", "#94A3B8"]
    return [
        {"name": name, "color": color, "default_duration": 60}
        for name, color in zip(SAMPLE_TAGS, colors)
    ]
