from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models.timer.themeSessionModel import ThemeSession
from collections import defaultdict

try:
    from openai import OpenAI
    openai_available = True
except ImportError:  # pragma: no cover
    openai_available = False


def _build_user_context(user, days=30):
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)

    sessions = StudySession.objects.filter(user=user, end_time__gte=start_date, end_time__lte=end_date)
    events = CalendarEvent.objects.filter(user=user, start_time__gte=start_date, start_time__lte=end_date)
    theme_sessions = ThemeSession.objects.filter(user=user, started_at__gte=start_date)

    total_study_minutes = sum(s.duration for s in sessions)
    total_break_minutes = sum(s.break_duration for s in sessions)
    total_pause_seconds = sum(s.pause_duration for s in sessions)
    session_count = sessions.count()
    avg_session = round(total_study_minutes / session_count, 1) if session_count else 0
    overtime_count = sessions.filter(status='Overtime').count()

    hour_totals = defaultdict(int)
    for s in sessions:
        hour_totals[s.end_time.hour] += s.duration
    peak_hours = sorted(hour_totals, key=hour_totals.get, reverse=True)[:3]

    def fmt_hour(h):
        suffix = 'am' if h < 12 else 'pm'
        display = h if h <= 12 else h - 12
        display = 12 if display == 0 else display
        return f"{display}{suffix}"

    peak_hours_fmt = ', '.join(fmt_hour(h) for h in peak_hours)

    dark_minutes = sum(s.duration_minutes for s in theme_sessions if s.theme == 'dark')
    light_minutes = sum(s.duration_minutes for s in theme_sessions if s.theme == 'light')
    total_theme = dark_minutes + light_minutes
    dark_pct = round(dark_minutes / total_theme * 100) if total_theme else 0

    upcoming = CalendarEvent.objects.filter(
        user=user,
        start_time__gte=timezone.now(),
        start_time__lte=timezone.now() + timedelta(days=14),
    ).order_by('start_time')[:10]

    upcoming_str = '\n'.join(
        f"  - {e.title} on {e.start_time.strftime('%A %d %b at %H:%M')}"
        for e in upcoming
    ) or '  None scheduled'

    dates = sorted(set(s.end_time.date() for s in sessions))
    streak = 0
    if dates:
        streak = 1
        for i in range(len(dates) - 1, 0, -1):
            if (dates[i] - dates[i - 1]).days == 1:
                streak += 1
            else:
                break
        if dates[-1] != timezone.now().date():
            streak = 0

    return f"""
Student profile for {user.first_name} {user.last_name}:
- Analysis period: last {days} days
- Total study sessions: {session_count}
- Total study time: {round(total_study_minutes / 60, 1)} hours
- Total break time: {round(total_break_minutes / 60, 1)} hours
- Total pause duration: {round(total_pause_seconds / 60, 1)} minutes
- Average session length: {avg_session} minutes
- Overtime sessions: {overtime_count} (ran past planned time)
- Current streak: {streak} consecutive days
- Peak study hours: {peak_hours_fmt}
- Dark mode usage: {dark_pct}% ({'likely a night owl' if dark_pct > 60 else 'prefers daytime work'})
- Upcoming calendar events (next 14 days):
{upcoming_str}
""".strip()


SYSTEM_PROMPT = """You are StudyFlax AI, a friendly and insightful study coach built into a student time management app.
You have access to the student's real study data — their sessions, patterns, calendar, and habits.
Give personalised, actionable advice based on their actual data.
Be encouraging but honest. Keep responses concise (2-4 paragraphs max unless asked for a schedule).
When suggesting schedules, use specific times based on their peak study hours.
Format schedule recommendations as clear bullet points with times.
Never make up data — only reference what's in the context provided."""


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_ai_insights(request):
    if not openai_available:
        return Response({'error': 'OpenAI package not installed'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    api_key = getattr(settings, 'OPENAI_API_KEY', None)
    if not api_key:
        return Response({'error': 'OpenAI API key not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    days = int(request.data.get('days', 30))
    user_context = _build_user_context(request.user, days)

    prompt = f"""Based on this student's study data, provide:
1. A brief personalised summary of their study patterns (2-3 sentences)
2. Their top 2-3 strengths as a student based on the data
3. Their top 2-3 areas for improvement
4. A recommended daily study schedule for this week based on their peak hours and upcoming events

Student data:
{user_context}"""

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model='gpt-4o',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': prompt},
            ],
            max_tokens=800,
            temperature=0.7,
        )
        return Response({'insights': response.choices[0].message.content, 'contextUsed': user_context})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_chat(request):
    if not openai_available:
        return Response({'error': 'OpenAI package not installed'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    api_key = getattr(settings, 'OPENAI_API_KEY', None)
    if not api_key:
        return Response({'error': 'OpenAI API key not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    messages = request.data.get('messages', [])
    days = int(request.data.get('days', 30))

    if not messages:
        return Response({'error': 'messages array required'}, status=status.HTTP_400_BAD_REQUEST)

    user_context = _build_user_context(request.user, days)
    system_with_context = f"{SYSTEM_PROMPT}\n\nCurrent student data:\n{user_context}"

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model='gpt-4o',
            messages=[{'role': 'system', 'content': system_with_context}] + messages,
            max_tokens=600,
            temperature=0.7,
        )
        return Response({'reply': response.choices[0].message.content})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
