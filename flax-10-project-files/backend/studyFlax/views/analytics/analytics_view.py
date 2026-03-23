"""
Analytics API views for study session summaries and progress tracking.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict

from studyFlax.models.timer.session_model import StudySession
from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from .session_analytics_service import compute_active_days, compute_streaks

def _get_sessions(user, start_date, end_date):
    """Fetch study sessions for the given user and date range."""

    return StudySession.objects.filter(
        user=user, end_time__gte=start_date, end_time__lte=end_date,
    )

def _aggregate_totals(sessions):
    """Return dict of aggregated session totals using DB aggregation."""

    from django.db.models import Sum, Avg, Max
    agg = sessions.aggregate(
        total_study=Sum('duration'), total_break=Sum('break_duration'),
        total_pause=Sum('pause_duration'), avg_dur=Avg('duration'), max_dur=Max('duration'),
    )
    return {k: v or 0 for k, v in agg.items()}

def _build_daily_breakdown(sessions):
    """Build sorted daily work/break/session-count breakdown. work and break are in minutes."""

    daily = defaultdict(lambda: {'date': '', 'work': 0, 'break': 0, 'sessions': 0})
    for s in sessions:
        key = s.end_time.date().isoformat()
        daily[key]['date'] = key
        daily[key]['work'] += s.duration // 60
        daily[key]['break'] += s.break_duration // 60
        daily[key]['sessions'] += 1
    return sorted(daily.values(), key=lambda x: x['date'])

def _build_heatmap(sessions):
    """Build a 7x24 heatmap of study minutes by weekday and hour."""

    data = [[0] * 24 for _ in range(7)]
    for s in sessions:
        data[s.end_time.weekday()][s.end_time.hour] += s.duration // 60
    return data

def _build_analytics_response(sessions, days):
    """Assemble the full analytics response dict from a sessions queryset."""

    totals = _aggregate_totals(sessions)
    current_streak, longest_streak = compute_streaks(list(sessions))
    return {
        'summary': _build_summary_dict(sessions, totals, current_streak, longest_streak),
        'daily_breakdown': _build_daily_breakdown(sessions),
        'heatmap': {
            'data': _build_heatmap(sessions),
            'days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'hours': list(range(24)),
        },
        'period_days': days,
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analytics_summary(request):
    """Return a full analytics summary: totals, daily breakdown, and heatmap."""

    days = int(request.GET.get('days', 30))
    end_date = timezone.now()
    sessions = _get_sessions(request.user, end_date - timedelta(days=days), end_date)
    return Response(_build_analytics_response(sessions, days))

def _build_summary_dict(sessions, totals, current_streak, longest_streak):
    """Assemble the summary dict from precomputed values."""

    return {
        'total_sessions': sessions.count(),
        'total_study_hours': round(totals['total_study'] / 3600, 1),
        'total_break_hours': round(totals['total_break'] / 3600, 1),
        'total_pause_duration': totals['total_pause'],
        'avg_session_minutes': round(totals['avg_dur'] / 60, 1),
        'longest_session_minutes': round(totals['max_dur'] / 60, 1),
        'current_streak_days': current_streak,
        'longest_streak_days': longest_streak,
        'overtime_sessions': sessions.filter(status='Overtime').count(),
        'work_break_ratio': _safe_ratio(totals['total_study'], totals['total_break']),
        'active_days': compute_active_days(sessions),
    }

def _safe_ratio(numerator, denominator):
    """Return rounded ratio or None if denominator is zero."""

    return round(numerator / denominator, 2) if denominator > 0 else None

def _build_actual_by_day(sessions):
    """Aggregate actual study minutes per day from sessions."""

    by_day = defaultdict(int)
    for s in sessions:
        by_day[s.end_time.date().isoformat()] += s.duration // 60
    return by_day

def _build_planned_by_day(events):
    """Aggregate planned minutes per day from calendar events."""

    by_day = defaultdict(int)
    for e in events:
        key = e.start_time.date().isoformat()
        by_day[key] += int((e.end_time - e.start_time).total_seconds() / 60)
    return by_day

def _merge_daily_progress(actual, planned):
    """Merge actual and planned dicts into a sorted progress list."""

    all_dates = sorted(set(list(actual.keys()) + list(planned.keys())))
    return [
        {'date': d, 'planned_hours': round(planned.get(d, 0) / 60, 2),
         'actual_hours': round(actual.get(d, 0) / 60, 2)}
        for d in all_dates
    ]

def _build_progress_response(sessions, events, days):
    """Build the progress response dict from sessions and calendar events."""

    actual = _build_actual_by_day(sessions)
    planned = _build_planned_by_day(events)
    total_planned = sum(planned.values())
    total_actual = sum(actual.values())
    return {
        'daily_progress': _merge_daily_progress(actual, planned),
        'summary': {
            'total_planned_hours': round(total_planned / 60, 1),
            'total_actual_hours': round(total_actual / 60, 1),
            'adherence_percentage': _safe_ratio(total_actual * 100, total_planned),
        },
        'period_days': days,
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_progress_data(request):
    """Return daily planned vs actual study hours and adherence percentage."""

    days = int(request.GET.get('days', 30))
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    sessions = _get_sessions(request.user, start_date, end_date)
    events = CalendarEvent.objects.filter(user=request.user, start_time__gte=start_date, start_time__lte=end_date)
    return Response(_build_progress_response(sessions, events, days))
