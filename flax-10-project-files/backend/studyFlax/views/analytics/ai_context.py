"""
Analytics AI study context builders.
"""

from datetime import timedelta

from django.utils import timezone

from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.models.timer.session_model import StudySession
from studyFlax.models.timer.theme_session_model import ThemeSession

from .session_analytics_service import compute_peak_hour, compute_streaks, fmt_hour


def fetch_study_data(user, days):
    end = timezone.now()
    start = end - timedelta(days=days)
    sessions = StudySession.objects.filter(user=user, end_time__gte=start, end_time__lte=end)
    themes = ThemeSession.objects.filter(user=user, started_at__gte=start)
    return sessions, themes

def compute_session_stats(sessions):
    total_study = sum(item.duration for item in sessions)
    total_break = sum(item.break_duration for item in sessions)
    total_pause = sum(item.pause_duration for item in sessions)
    count = sessions.count()
    average = round(total_study / count, 1) if count else 0
    overtime = sessions.filter(status='Overtime').count()
    return total_study, total_break, total_pause, count, average, overtime

def get_theme_minutes(themes):
    dark = sum(item.duration_minutes for item in themes if item.theme == 'dark')
    light = sum(item.duration_minutes for item in themes if item.theme == 'light')
    return dark, light

def compute_theme_pct(themes):
    dark, light = get_theme_minutes(themes)
    total = dark + light
    return round(dark / total * 100) if total else 0

def format_upcoming_events(user):
    upcoming = CalendarEvent.objects.filter(
        user=user,
        start_time__gte=timezone.now(),
        start_time__lte=timezone.now() + timedelta(days=14),
    ).order_by('start_time')[:10]
    if not upcoming:
        return '  None scheduled'
    return '\n'.join(format_event_line(item) for item in upcoming)

def format_event_line(event):
    date_text = event.start_time.strftime('%A %d %b at %H:%M')
    return f"  - {event.title} on {date_text}"

def build_stats_summary(sessions, themes):
    total_study, total_break, total_pause, count, average, overtime = compute_session_stats(sessions)
    dark_pct = compute_theme_pct(themes)
    session_list = list(sessions)
    current_streak, _ = compute_streaks(session_list)
    peak_hour = compute_peak_hour(session_list)
    return total_study, total_break, total_pause, count, average, overtime, dark_pct, current_streak, peak_hour

def build_stats_lines(sessions, themes):
    stats = build_stats_summary(sessions, themes)
    return '\n'.join(build_stat_lines(stats))

def build_stat_lines(stats):
    total_study, total_break, total_pause, count, average, overtime, dark_pct, current_streak, peak_hour = stats
    owl_label = 'likely a night owl' if dark_pct > 60 else 'prefers daytime work'
    return [
        f"- Total study sessions: {count}",
        f"- Total study time: {round(total_study / 3600, 1)} hours",
        f"- Total break time: {round(total_break / 3600, 1)} hours",
        f"- Total pause duration: {round(total_pause / 60, 1)} minutes",
        f"- Average session length: {round(average / 60, 1)} minutes",
        f"- Overtime sessions: {overtime} (ran past planned time)",
        f"- Current streak: {current_streak} consecutive days",
        f"- Peak study hour: {fmt_hour(peak_hour)}",
        f"- Dark mode usage: {dark_pct}% ({owl_label})",
    ]

def build_user_context(user, days=30):
    sessions, themes = fetch_study_data(user, days)
    stats = build_stats_lines(sessions, themes)
    return (
        f"Student profile for {user.first_name} {user.last_name}:\n"
        f"- Analysis period: last {days} days\n"
        f"{stats}\n"
        f"- Upcoming calendar events (next 14 days):\n{format_upcoming_events(user)}"
    )
