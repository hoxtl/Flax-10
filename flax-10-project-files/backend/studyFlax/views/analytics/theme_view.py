"""
Theme session logging and statistics views.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict

from studyFlax.models.timer.theme_session_model import ThemeSession
from .session_analytics_service import fmt_hour

def _validate_theme_data(data):
    """Validate theme session payload. Return (start, end, theme, error_msg)."""
    theme = data.get('theme')
    started_at = data.get('started_at')
    ended_at = data.get('ended_at')
    if not all([theme, started_at, ended_at]):
        return None, None, None, 'theme, started_at, ended_at required'
    if theme not in ('light', 'dark'):
        return None, None, None, 'theme must be light or dark'
    from django.utils.dateparse import parse_datetime
    start, end = parse_datetime(started_at), parse_datetime(ended_at)
    if not start or not end or end <= start:
        return None, None, None, 'Invalid datetime values'
    return start, end, theme, None

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_theme_session(request):
    """Log a new theme session (light/dark mode usage period)."""
    start, end, theme, error = _validate_theme_data(request.data)
    if error:
        return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
    duration_minutes = max(1, int((end - start).total_seconds() / 60))
    ThemeSession.objects.create(
        user=request.user, theme=theme,
        started_at=start, ended_at=end, duration_minutes=duration_minutes,
    )
    return Response({'status': 'logged', 'duration_minutes': duration_minutes}, status=status.HTTP_201_CREATED)

def _aggregate_by_hour(sessions):
    """Split sessions into dark/light hourly totals."""
    dark_hours = defaultdict(int)
    light_hours = defaultdict(int)
    for s in sessions:
        bucket = dark_hours if s.theme == 'dark' else light_hours
        bucket[s.started_at.hour] += s.duration_minutes
    return dark_hours, light_hours

def _compute_night_owl(dark_hours, dark_minutes):
    """Return True if over half of dark-mode usage is between 8pm and 6am."""
    night = sum(m for h, m in dark_hours.items() if h >= 20 or h < 6)
    return (night / dark_minutes > 0.5) if dark_minutes > 0 else False

def _compute_theme_totals(sessions):
    """Return (light_minutes, dark_minutes, total) from theme sessions."""
    light = sum(s.duration_minutes for s in sessions if s.theme == 'light')
    dark = sum(s.duration_minutes for s in sessions if s.theme == 'dark')
    return light, dark, light + dark

def _build_theme_response(sessions, days):
    """Build the full theme stats response dict."""
    light, dark, total = _compute_theme_totals(sessions)
    dark_hours, light_hours = _aggregate_by_hour(sessions)
    return {
        'summary': {
            'light_minutes': light, 'dark_minutes': dark, 'total_minutes': total,
            'light_percentage': round(light / total * 100, 1) if total else 0,
            'dark_percentage': round(dark / total * 100, 1) if total else 0,
            'is_night_owl': _compute_night_owl(dark_hours, dark),
            'peak_dark_hour': fmt_hour(max(dark_hours, key=dark_hours.get) if dark_hours else None),
            'peak_light_hour': fmt_hour(max(light_hours, key=light_hours.get) if light_hours else None),
        },
        'hourly_dark': [dark_hours.get(h, 0) for h in range(24)],
        'hourly_light': [light_hours.get(h, 0) for h in range(24)],
        'period_days': days,
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_theme_stats(request):
    """Return theme usage statistics: summary, hourly breakdown, and night-owl flag."""
    days = int(request.GET.get('days', 30))
    sessions = ThemeSession.objects.filter(
        user=request.user, started_at__gte=timezone.now() - timedelta(days=days),
    )
    return Response(_build_theme_response(sessions, days))
