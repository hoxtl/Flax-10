"""
AI-powered study insights and chat views using OpenAI.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict
from itertools import takewhile

from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models.timer.themeSessionModel import ThemeSession

try:
    import openai
    OpenAI = getattr(openai, 'OpenAI', None)
    openai_available = OpenAI is not None
except Exception:
    OpenAI = None
    openai_available = False

def _check_openai():
    """Return (api_key, error_response) — error_response is None when available."""
    if not openai_available:
        return None, Response({'error': 'OpenAI package not installed'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    api_key = getattr(settings, 'OPENAI_API_KEY', None)
    if not api_key:
        return None, Response({'error': 'OpenAI API key not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return api_key, None

def _fetch_study_data(user, days):
    """Fetch sessions, events, and theme sessions for the analysis period."""
    end = timezone.now()
    start = end - timedelta(days=days)
    sessions = StudySession.objects.filter(user=user, end_time__gte=start, end_time__lte=end)
    themes = ThemeSession.objects.filter(user=user, started_at__gte=start)
    return sessions, themes

def _compute_session_stats(sessions):
    """Return basic aggregated stats from study sessions."""
    total_study = sum(s.duration for s in sessions)
    total_break = sum(s.break_duration for s in sessions)
    total_pause = sum(s.pause_duration for s in sessions)
    count = sessions.count()
    avg = round(total_study / count, 1) if count else 0
    overtime = sessions.filter(status='Overtime').count()
    return total_study, total_break, total_pause, count, avg, overtime

def _compute_peak_hours(sessions):
    """Return formatted top-3 peak study hours."""
    hour_totals = defaultdict(int)
    for s in sessions:
        hour_totals[s.end_time.hour] += s.duration
    peak = sorted(hour_totals, key=hour_totals.get, reverse=True)[:3]
    return ', '.join(_fmt_hour(h) for h in peak)

def _fmt_hour(h):
    """Format an hour integer as '9am' / '3pm'."""
    suffix = 'am' if h < 12 else 'pm'
    display = h if h <= 12 else h - 12
    return f"{display or 12}{suffix}"

def _compute_theme_pct(themes):
    """Return dark-mode percentage from theme sessions."""
    dark = sum(s.duration_minutes for s in themes if s.theme == 'dark')
    total = dark + sum(s.duration_minutes for s in themes if s.theme == 'light')
    return round(dark / total * 100) if total else 0

def _count_trailing_streak(dates):
    """Count consecutive days from the most recent date backwards."""
    pairs = [(dates[i] - dates[i - 1]).days for i in range(len(dates) - 1, 0, -1)]
    return 1 + sum(1 for _ in takewhile(lambda d: d == 1, pairs))

def _compute_streak(sessions):
    """Return the current consecutive-day streak."""
    dates = sorted(set(s.end_time.date() for s in sessions))
    if not dates:
        return 0
    streak = _count_trailing_streak(dates)
    return streak if dates[-1] == timezone.now().date() else 0

def _format_upcoming(user):
    """Return formatted string of upcoming calendar events."""
    upcoming = CalendarEvent.objects.filter(
        user=user, start_time__gte=timezone.now(),
        start_time__lte=timezone.now() + timedelta(days=14),
    ).order_by('start_time')[:10]
    if not upcoming:
        return '  None scheduled'
    return '\n'.join(f"  - {e.title} on {e.start_time.strftime('%A %d %b at %H:%M')}" for e in upcoming)

def _build_stats_lines(sessions, themes):
    """Return a formatted multi-line string of study statistics."""
    total_study, total_break, total_pause, count, avg, overtime = _compute_session_stats(sessions)
    dark_pct = _compute_theme_pct(themes)
    owl_label = 'likely a night owl' if dark_pct > 60 else 'prefers daytime work'
    return (
        f"- Total study sessions: {count}\n"
        f"- Total study time: {round(total_study / 60, 1)} hours\n"
        f"- Total break time: {round(total_break / 60, 1)} hours\n"
        f"- Total pause duration: {round(total_pause / 60, 1)} minutes\n"
        f"- Average session length: {avg} minutes\n"
        f"- Overtime sessions: {overtime} (ran past planned time)\n"
        f"- Current streak: {_compute_streak(sessions)} consecutive days\n"
        f"- Peak study hours: {_compute_peak_hours(sessions)}\n"
        f"- Dark mode usage: {dark_pct}% ({owl_label})"
    )

def _build_user_context(user, days=30):
    """Assemble a text summary of the user's study data for the AI prompt."""
    sessions, themes = _fetch_study_data(user, days)
    stats = _build_stats_lines(sessions, themes)
    return (
        f"Student profile for {user.first_name} {user.last_name}:\n"
        f"- Analysis period: last {days} days\n"
        f"{stats}\n"
        f"- Upcoming calendar events (next 14 days):\n{_format_upcoming(user)}"
    )

SYSTEM_PROMPT = (
    "You are StudyFlax AI, a friendly and insightful study coach built into a student time management app.\n"
    "You have access to the student's real study data — their sessions, patterns, calendar, and habits.\n"
    "Give personalised, actionable advice based on their actual data.\n"
    "Be encouraging but honest. Keep responses concise (2-4 paragraphs max unless asked for a schedule).\n"
    "When suggesting schedules, use specific times based on their peak study hours.\n"
    "Format schedule recommendations as clear bullet points with times.\n"
    "Never make up data — only reference what's in the context provided."
)

INSIGHT_PROMPT_TEMPLATE = (
    "Based on this student's study data, provide:\n"
    "1. A brief personalised summary of their study patterns (2-3 sentences)\n"
    "2. Their top 2-3 strengths as a student based on the data\n"
    "3. Their top 2-3 areas for improvement\n"
    "4. A recommended daily study schedule for this week based on their peak hours and upcoming events\n\n"
    "Student data:\n{context}"
)

def _call_openai(api_key, messages, max_tokens=800):
    """Make a chat completion request to OpenAI."""
    client = OpenAI(api_key=api_key)
    return client.chat.completions.create(
        model='gpt-4o', messages=messages, max_tokens=max_tokens, temperature=0.7,
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_ai_insights(request):
    """Generate AI-powered study insights for the current user."""
    api_key, err = _check_openai()
    if err:
        return err
    days = int(request.data.get('days', 30))
    context = _build_user_context(request.user, days)
    try:
        resp = _call_openai(api_key, [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': INSIGHT_PROMPT_TEMPLATE.format(context=context)},
        ])
        return Response({'insights': resp.choices[0].message.content, 'contextUsed': context})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_chat(request):
    """Handle a multi-turn AI chat conversation with study context."""
    api_key, err = _check_openai()
    if err:
        return err
    messages = request.data.get('messages', [])
    if not messages:
        return Response({'error': 'messages array required'}, status=status.HTTP_400_BAD_REQUEST)
    days = int(request.data.get('days', 30))
    context = _build_user_context(request.user, days)
    system_msg = f"{SYSTEM_PROMPT}\n\nCurrent student data:\n{context}"
    try:
        resp = _call_openai(api_key, [{'role': 'system', 'content': system_msg}] + messages, 600)
        return Response({'reply': resp.choices[0].message.content})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
