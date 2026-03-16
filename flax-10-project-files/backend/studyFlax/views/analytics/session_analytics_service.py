"""
Shared StudySession analytics helpers used by multiple views.
"""

from collections import defaultdict
from datetime import timedelta

from django.utils import timezone

def get_session_dates(sessions):
    """Return sorted unique session end dates."""
    return sorted(set(s.end_time.date() for s in sessions))

def compute_streaks_from_dates(dates):
    """Return (current_streak, longest_streak) from sorted unique dates."""
    if not dates:
        return 0, 0
    longest = current = 1
    for i in range(1, len(dates)):
        current = current + 1 if (dates[i] - dates[i - 1]).days == 1 else 1
        longest = max(longest, current)
    today = timezone.now().date()
    active = current if dates[-1] >= today - timedelta(days=1) else 0
    return active, longest

def compute_streaks(sessions):
    """Return (current_streak, longest_streak) from sessions."""
    return compute_streaks_from_dates(get_session_dates(sessions))

def compute_peak_hour(sessions):
    """Return the hour of day with the highest total minutes studied."""
    totals = defaultdict(int)
    for session in sessions:
        totals[session.end_time.hour] += session.duration
    return max(totals, key=totals.get) if totals else 0

def compute_average_duration(sessions):
    """Return average duration in minutes."""
    if not sessions:
        return 0
    return sum(s.duration for s in sessions) / len(sessions)

def compute_recent_active_days(sessions, days=7):
    """Return distinct active days in the last N days."""
    cutoff = timezone.now() - timedelta(days=days)
    return len(set(s.end_time.date() for s in sessions if s.end_time >= cutoff))

def compute_active_days(sessions):
    """Return distinct active days across sessions."""
    return len(set(s.end_time.date() for s in sessions))

def fmt_hour(h):
    """Format an hour integer as '9am' / '3pm', or None if h is None."""
    if h is None:
        return None
    suffix = 'am' if h < 12 else 'pm'
    display = h if h <= 12 else h - 12
    return f"{display or 12}{suffix}"

