"""
Auto scheduler time-window helpers.
"""

from datetime import datetime, time, timedelta


def _get_base_window(day, wake_time, sleep_time):
    if not (wake_time and sleep_time):
        return _full_day_window(day)
    start = datetime.combine(day, wake_time)
    end = datetime.combine(day, sleep_time)
    return (start, end + timedelta(days=1)) if end <= start else (start, end)


def _full_day_window(day):
    return datetime.combine(day, time(0, 0)), datetime.combine(day + timedelta(days=1), time(0, 0))


def _apply_worktime_pref(start, end, day, preference):
    if preference == "day":
        return _bounded_window(start, end, datetime.combine(day, time(8, 0)), datetime.combine(day, time(18, 0)))
    if preference == "night":
        return _bounded_window(start, end, datetime.combine(day, time(18, 0)), datetime.combine(day + timedelta(days=1), time(2, 0)))
    return start, end


def _bounded_window(start, end, minimum, maximum):
    return max(start, minimum), min(end, maximum)


def _resolve_window(day, wake_time, sleep_time, preference):
    start, end = _get_base_window(day, wake_time, sleep_time)
    return _apply_worktime_pref(start, end, day, preference)


def _is_allowed_day(day, preference):
    if preference == "both":
        return True
    is_weekend = day.weekday() >= 5
    return is_weekend if preference == "weekends" else not is_weekend
