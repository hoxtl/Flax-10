from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Avg, Max
from django.utils import timezone
from datetime import timedelta
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from collections import defaultdict


def _compute_streaks(sessions):
    dates = sorted(set(s.end_time.date() for s in sessions))
    if not dates:
        return 0, 0
    longest = 1
    temp = 1
    for i in range(1, len(dates)):
        if (dates[i] - dates[i - 1]).days == 1:
            temp += 1
            longest = max(longest, temp)
        else:
            temp = 1
    # Allow streak if last session was today OR yesterday
    today = timezone.now().date()
    current = temp if dates[-1] >= today - timedelta(days=1) else 0
    return current, longest


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analytics_summary(request):
    days = int(request.GET.get('days', 30))
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)

    sessions = StudySession.objects.filter(
        user=request.user,
        end_time__gte=start_date,
        end_time__lte=end_date,
    )

    total_sessions = sessions.count()
    total_study_seconds = sessions.aggregate(Sum('duration'))['duration__sum'] or 0
    total_break_seconds = sessions.aggregate(Sum('break_duration'))['break_duration__sum'] or 0
    total_pause_seconds = sessions.aggregate(Sum('pause_duration'))['pause_duration__sum'] or 0
    avg_session_seconds = sessions.aggregate(Avg('duration'))['duration__avg'] or 0
    longest_session_seconds = sessions.aggregate(Max('duration'))['duration__max'] or 0
    overtime_sessions = sessions.filter(status='Overtime').count()

    work_break_ratio = round(
        total_study_seconds / total_break_seconds, 2
    ) if total_break_seconds > 0 else None

    daily_data = defaultdict(lambda: {'date': '', 'work': 0, 'break': 0, 'sessions': 0})
    for session in sessions:
        key = session.end_time.date().isoformat()
        daily_data[key]['date'] = key
        daily_data[key]['work'] += session.duration / 60
        daily_data[key]['break'] += session.break_duration / 60
        daily_data[key]['sessions'] += 1

    daily_breakdown = sorted(daily_data.values(), key=lambda x: x['date'])

    heatmap_data = [[0] * 24 for _ in range(7)]
    for session in sessions:
        heatmap_data[session.end_time.weekday()][session.end_time.hour] += session.duration / 60

    current_streak, longest_streak = _compute_streaks(list(sessions))
    active_days = len(set(s.end_time.date() for s in sessions))

    return Response({
        'summary': {
            'total_sessions': total_sessions,
            'total_study_hours': round(total_study_seconds / 3600, 1),
            'total_break_hours': round(total_break_seconds / 3600, 1),
            'total_pause_duration': total_pause_seconds,
            'avg_session_minutes': round(avg_session_seconds / 60, 1),
            'longest_session_minutes': round(longest_session_seconds / 60, 1),
            'current_streak_days': current_streak,
            'longest_streak_days': longest_streak,
            'overtime_sessions': overtime_sessions,
            'work_break_ratio': work_break_ratio,
            'active_days': active_days,
        },
        'daily_breakdown': daily_breakdown,
        'heatmap': {
            'data': heatmap_data,
            'days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'hours': list(range(24)),
        },
        'period_days': days,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_progress_data(request):
    days = int(request.GET.get('days', 30))
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)

    sessions = StudySession.objects.filter(
        user=request.user,
        end_time__gte=start_date,
        end_time__lte=end_date,
    )

    actual_by_day = defaultdict(int)
    for session in sessions:
        actual_by_day[session.end_time.date().isoformat()] += session.duration / 60

    events = CalendarEvent.objects.filter(
        user=request.user,
        start_time__gte=start_date,
        start_time__lte=end_date,
    )

    planned_by_day = defaultdict(int)
    for event in events:
        key = event.start_time.date().isoformat()
        duration_minutes = int((event.end_time - event.start_time).total_seconds() / 60)
        planned_by_day[key] += duration_minutes

    all_dates = sorted(set(list(actual_by_day.keys()) + list(planned_by_day.keys())))
    daily_progress = [
        {
            'date': date,
            'planned_hours': round(planned_by_day.get(date, 0) / 60, 2),
            'actual_hours': round(actual_by_day.get(date, 0) / 60, 2),
        }
        for date in all_dates
    ]

    total_planned = sum(planned_by_day.values())
    total_actual = sum(actual_by_day.values())
    adherence_pct = round(
        (total_actual / total_planned) * 100, 1
    ) if total_planned > 0 else None

    return Response({
        'daily_progress': daily_progress,
        'summary': {
            'total_planned_hours': round(total_planned / 60, 1),
            'total_actual_hours': round(total_actual / 60, 1),
            'adherence_percentage': adherence_pct,
        },
        'period_days': days,
    })