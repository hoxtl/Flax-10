"""
Shared recurrence and date-range utilities for calendar expansion.
"""

import calendar
from datetime import timedelta


def is_time_overlap(event_start, event_end, view_start, view_end):
    """Return True if two time ranges overlap."""
    return event_start < view_end and event_end > view_start

def add_months(dt, months, max_day=None):
    """Return dt moved by a number of months."""
    month = dt.month + months
    year = dt.year + (month - 1) // 12
    month = ((month - 1) % 12) + 1
    month_max = calendar.monthrange(year, month)[1]
    day_cap = month_max if max_day is None else min(month_max, max_day)
    day = min(dt.day, day_cap)
    return dt.replace(year=year, month=month, day=day)

def add_years(dt, years, max_day=28):
    """Return dt moved by a number of years."""
    try:
        return dt.replace(year=dt.year + years)
    except ValueError:
        return dt.replace(year=dt.year + years, day=max_day)

def calc_occurrence(start, frequency, interval, num, monthly_max_day=None):
    """Return the datetime of the num-th recurrence from start."""
    delta = interval * num
    if frequency == 'daily':
        return start + timedelta(days=delta)
    if frequency == 'weekly':
        return start + timedelta(weeks=delta)
    if frequency == 'monthly':
        return add_months(start, delta, max_day=monthly_max_day)
    if frequency == 'yearly':
        return add_years(start, delta)
    return None

def next_society_occurrence(current, recurrence):
    """Return the next occurrence datetime for a society recurrence string."""
    if recurrence == 'daily':
        return current + timedelta(days=1)
    if recurrence == 'weekly':
        return current + timedelta(weeks=1)
    if recurrence == 'biweekly':
        return current + timedelta(weeks=2)
    if recurrence == 'monthly':
        return add_months(current, 1, max_day=28)
    if recurrence == 'yearly':
        return add_years(current, 1)
    return current + timedelta(days=365)
