"""
Analytics AI schedule parsing helpers.
"""

import json


def strip_code_fence(content):
    raw = content.strip()
    if not raw.startswith('```'):
        return raw
    fenced = raw.split('```')[1]
    return fenced[4:] if fenced.startswith('json') else fenced


def parse_schedule_events(content):
    try:
        events = json.loads(strip_code_fence(content))
    except (json.JSONDecodeError, TypeError):
        return []
    return events if isinstance(events, list) else []
