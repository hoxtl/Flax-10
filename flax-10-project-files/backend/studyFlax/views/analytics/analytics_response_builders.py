"""
Response builders for analytics and progress endpoints.
"""

from collections import defaultdict

from .session_analytics_service import compute_active_days, compute_streaks


def aggregate_totals(sessions):
    """Return dict of aggregated session totals using DB aggregation."""

    from django.db.models import Sum, Avg, Max

    aggregated = sessions.aggregate(
        total_study=Sum("duration"),
        total_break=Sum("break_duration"),
        total_pause=Sum("pause_duration"),
        avg_dur=Avg("duration"),
        max_dur=Max("duration"),
    )
    return {key: value or 0 for key, value in aggregated.items()}


def build_daily_breakdown(sessions):
    """Build sorted daily work, break, and session count breakdown."""

    daily = defaultdict(lambda: {"date": "", "work": 0, "break": 0, "sessions": 0})
    for session in sessions:
        key = session.end_time.date().isoformat()
        daily[key]["date"] = key
        daily[key]["work"] += session.duration // 60
        daily[key]["break"] += session.break_duration // 60
        daily[key]["sessions"] += 1
    return sorted(daily.values(), key=lambda item: item["date"])


def build_heatmap(sessions):
    """Build a 7x24 heatmap of study minutes by weekday and hour."""

    data = [[0] * 24 for _ in range(7)]
    for session in sessions:
        data[session.end_time.weekday()][session.end_time.hour] += session.duration // 60
    return data


def safe_ratio(numerator, denominator):
    """Return rounded ratio or None if denominator is zero."""

    return round(numerator / denominator, 2) if denominator > 0 else None


def build_summary_dict(sessions, totals, current_streak, longest_streak):
    """Assemble the summary dict from precomputed values."""

    return {
        "total_sessions": sessions.count(),
        "total_study_hours": round(totals["total_study"] / 3600, 1),
        "total_break_hours": round(totals["total_break"] / 3600, 1),
        "total_pause_duration": totals["total_pause"],
        "avg_session_minutes": round(totals["avg_dur"] / 60, 1),
        "longest_session_minutes": round(totals["max_dur"] / 60, 1),
        "current_streak_days": current_streak,
        "longest_streak_days": longest_streak,
        "overtime_sessions": sessions.filter(status="Overtime").count(),
        "work_break_ratio": safe_ratio(totals["total_study"], totals["total_break"]),
        "active_days": compute_active_days(sessions),
    }


def build_analytics_response(sessions, days):
    """Assemble the full analytics response dict from a sessions queryset."""

    totals = aggregate_totals(sessions)
    current_streak, longest_streak = compute_streaks(list(sessions))
    return {
        "summary": build_summary_dict(sessions, totals, current_streak, longest_streak),
        "daily_breakdown": build_daily_breakdown(sessions),
        "heatmap": {
            "data": build_heatmap(sessions),
            "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "hours": list(range(24)),
        },
        "period_days": days,
    }


def build_actual_by_day(sessions):
    """Aggregate actual study minutes per day from sessions."""

    by_day = defaultdict(int)
    for session in sessions:
        by_day[session.end_time.date().isoformat()] += session.duration // 60
    return by_day


def build_planned_by_day(events):
    """Aggregate planned minutes per day from calendar events."""

    by_day = defaultdict(int)
    for event in events:
        key = event.start_time.date().isoformat()
        by_day[key] += int((event.end_time - event.start_time).total_seconds() / 60)
    return by_day


def _all_progress_dates(actual, planned):
    return sorted(set(actual.keys()) | set(planned.keys()))


def _build_progress_entry(date_key, actual, planned):
    return {
        "date": date_key,
        "planned_hours": round(planned.get(date_key, 0) / 60, 2),
        "actual_hours": round(actual.get(date_key, 0) / 60, 2),
    }


def merge_daily_progress(actual, planned):
    """Merge actual and planned dicts into a sorted progress list."""

    return [_build_progress_entry(date_key, actual, planned) for date_key in _all_progress_dates(actual, planned)]


def _progress_summary(actual, planned):
    total_planned = sum(planned.values())
    total_actual = sum(actual.values())
    return {
        "total_planned_hours": round(total_planned / 60, 1),
        "total_actual_hours": round(total_actual / 60, 1),
        "adherence_percentage": safe_ratio(total_actual * 100, total_planned),
    }


def build_progress_response(sessions, events, days):
    """Build the progress response dict from sessions and calendar events."""

    actual = build_actual_by_day(sessions)
    planned = build_planned_by_day(events)
    return {
        "daily_progress": merge_daily_progress(actual, planned),
        "summary": _progress_summary(actual, planned),
        "period_days": days,
    }
