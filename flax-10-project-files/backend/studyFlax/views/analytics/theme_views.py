from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict
from studyFlax.models.timer.themeSessionModel import ThemeSession


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_theme_session(request):
    data = request.data
    theme = data.get('theme')
    started_at = data.get('started_at')
    ended_at = data.get('ended_at')

    if not all([theme, started_at, ended_at]):
        return Response({'error': 'theme, started_at, ended_at required'}, status=status.HTTP_400_BAD_REQUEST)

    if theme not in ('light', 'dark'):
        return Response({'error': 'theme must be light or dark'}, status=status.HTTP_400_BAD_REQUEST)

    from django.utils.dateparse import parse_datetime
    start = parse_datetime(started_at)
    end = parse_datetime(ended_at)

    if not start or not end or end <= start:
        return Response({'error': 'Invalid datetime values'}, status=status.HTTP_400_BAD_REQUEST)

    duration_minutes = max(1, int((end - start).total_seconds() / 60))

    ThemeSession.objects.create(
        user=request.user,
        theme=theme,
        started_at=start,
        ended_at=end,
        duration_minutes=duration_minutes,
    )

    return Response({'status': 'logged', 'duration_minutes': duration_minutes}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_theme_stats(request):
    days = int(request.GET.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)

    sessions = ThemeSession.objects.filter(
        user=request.user,
        started_at__gte=start_date,
    )

    light_minutes = sum(s.duration_minutes for s in sessions if s.theme == 'light')
    dark_minutes = sum(s.duration_minutes for s in sessions if s.theme == 'dark')
    total_minutes = light_minutes + dark_minutes

    dark_hours = defaultdict(int)
    light_hours = defaultdict(int)
    for s in sessions:
        hour = s.started_at.hour
        if s.theme == 'dark':
            dark_hours[hour] += s.duration_minutes
        else:
            light_hours[hour] += s.duration_minutes

    peak_dark_hour = max(dark_hours, key=dark_hours.get) if dark_hours else None
    peak_light_hour = max(light_hours, key=light_hours.get) if light_hours else None

    night_minutes = sum(m for h, m in dark_hours.items() if h >= 20 or h < 6)
    is_night_owl = (night_minutes / dark_minutes > 0.5) if dark_minutes > 0 else False

    def fmt_hour(h):
        if h is None:
            return None
        suffix = 'am' if h < 12 else 'pm'
        display = h if h <= 12 else h - 12
        display = 12 if display == 0 else display
        return f"{display}{suffix}"

    return Response({
        'summary': {
            'light_minutes': light_minutes,
            'dark_minutes': dark_minutes,
            'total_minutes': total_minutes,
            'light_percentage': round(light_minutes / total_minutes * 100, 1) if total_minutes else 0,
            'dark_percentage': round(dark_minutes / total_minutes * 100, 1) if total_minutes else 0,
            'is_night_owl': is_night_owl,
            'peak_dark_hour': fmt_hour(peak_dark_hour),
            'peak_light_hour': fmt_hour(peak_light_hour),
        },
        'hourly_dark': [dark_hours.get(h, 0) for h in range(24)],
        'hourly_light': [light_hours.get(h, 0) for h in range(24)],
        'period_days': days,
    })
