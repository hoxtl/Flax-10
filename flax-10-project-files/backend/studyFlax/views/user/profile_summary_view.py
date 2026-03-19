"""Profile summary API view.

Computes study personas, streaks, badges, and weekly goal progress
for a given user's profile dashboard.
"""

import math

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

from studyFlax.models.auth.user_model import User
from studyFlax.models.timer.session_model import StudySession
from studyFlax.models.social.share_model import CalendarShare
from studyFlax.models.modules.enrollment_model import Enrollment
from studyFlax.models.modules.module_model import Module
from studyFlax.models.society import SocietyMembership
from studyFlax.serialisers.common import build_profile_photo_url
from studyFlax.views.analytics.session_analytics_service import compute_peak_hour, compute_recent_active_days, compute_streaks

PERSONAS = [
    {'id': 'night_owl', 'label': 'Night Owl', 'emoji': '🦉',
     'description': 'You come alive after dark. Your best thinking happens when the world goes quiet.'},
    {'id': 'early_bird', 'label': 'Early Bird', 'emoji': '🌅',
     'description': 'You front-load your day and hit the ground running. Morning hours are your superpower.'},
    {'id': 'afternoon_peak', 'label': 'Afternoon Grinder', 'emoji': '⚡',
     'description': 'Post-lunch is your prime time. You warm up slowly and hit your stride mid-afternoon.'},
    {'id': 'consistent', 'label': 'Consistent Scholar', 'emoji': '📐',
     'description': "You show up every day without fail. Consistency is your edge over everyone else."},
    {'id': 'sprint', 'label': 'Sprint Specialist', 'emoji': '🚀',
     'description': 'Short, intense bursts. You pack maximum focus into minimum time.'},
    {'id': 'marathon', 'label': 'Marathon Runner', 'emoji': '🏃',
     'description': 'Long sessions, deep focus. You build momentum and ride it all the way.'},
]

def _collect_session_stats(sessions):
    """Return (peak_hour, avg_duration, is_consistent) from sessions."""
    peak_hour = compute_peak_hour(sessions)
    avg_duration = sum(s.duration for s in sessions) / len(sessions) if sessions else 0
    return peak_hour, avg_duration, compute_recent_active_days(sessions, 7) >= 5

def derive_persona(sessions):
    if not sessions:
        return PERSONAS[0]
    peak_hour, avg_duration, is_consistent = _collect_session_stats(sessions)
    if is_consistent:
        return PERSONAS[3]
    if peak_hour >= 20 or peak_hour < 4:
        return PERSONAS[0]
    if peak_hour < 10:
        return PERSONAS[1]
    if 12 <= peak_hour < 17:
        return PERSONAS[2]
    if avg_duration <= 30:
        return PERSONAS[4]
    return PERSONAS[5] if avg_duration >= 75 else PERSONAS[2]

def _filter_complete(sessions):
    """Remove incomplete sessions from a list."""
    return [s for s in sessions if s.status != 'Incomplete']

def _session_totals(sessions):
    """Return (total_minutes, total_hours, session_count)."""
    total_minutes = sum(s.duration for s in sessions)
    return total_minutes, total_minutes / 60, len(sessions)

def _active_days_last_30(sessions_90):
    """Count distinct active days in the last 30 days."""
    cutoff = timezone.now() - timedelta(days=30)
    return len(set(s.end_time.date() for s in sessions_90 if s.end_time >= cutoff))

def _hour_badges(total_hours):
    """Return badges earned from cumulative study hours."""
    thresholds = [
        (1, '1hr', 'First Hour', '⏱️', 'Studied for 1 hour total', 'bronze'),
        (10, '10hr', 'Getting Started', '📖', 'Studied for 10 hours total', 'bronze'),
        (50, '50hr', 'Dedicated', '🔥', 'Studied for 50 hours total', 'silver'),
        (100, '100hr', 'Century', '💯', '100 hours of focused study', 'gold'),
        (250, '250hr', 'Scholar', '🎓', '250 hours of focused study', 'gold'),
        (500, '500hr', 'Legend', '👑', '500 hours — you are a legend', 'gold'),
    ]
    return [_badge(bid, label, emoji, desc, tier)
            for hrs, bid, label, emoji, desc, tier in thresholds if total_hours >= hrs]

def _session_count_badges(count):
    """Return badges earned from total session count."""
    thresholds = [
        (1, 'sessions_1', 'First Step', '🎯', 'Completed your first study session', 'bronze'),
        (10, 'sessions_10', 'Regular', '🎖️', 'Completed 10 study sessions', 'bronze'),
        (50, 'sessions_50', 'Committed', '🏅', '50 sessions completed', 'silver'),
        (100, 'sessions_100', 'Veteran', '🏆', '100 sessions completed', 'gold'),
    ]
    return [_badge(bid, label, emoji, desc, tier)
            for n, bid, label, emoji, desc, tier in thresholds if count >= n]

def _streak_badges(longest_streak):
    """Return badges earned from longest study streak."""
    thresholds = [
        (3, 'streak_3', 'On a Roll', '🔥', 'Studied 3 days in a row', 'bronze'),
        (7, 'streak_7', 'Week Warrior', '⚔️', '7-day study streak', 'silver'),
        (14, 'streak_14', 'Fortnight', '🏆', '14-day study streak', 'gold'),
        (30, 'streak_30', 'Iron Will', '💎', '30-day study streak', 'gold'),
    ]
    return [_badge(bid, label, emoji, desc, tier)
            for n, bid, label, emoji, desc, tier in thresholds if longest_streak >= n]

def _consistency_badges(active_days_30):
    """Return badges earned from monthly consistency."""
    thresholds = [
        (10, 'consistent_10', 'Steady Pace', '📅', 'Active 10 days this month', 'bronze'),
        (20, 'consistent_20', 'Month Grind', '🌟', 'Active 20 days this month', 'silver'),
        (28, 'consistent_28', 'Perfectionist', '✨', 'Active 28 days this month', 'gold'),
    ]
    return [_badge(bid, label, emoji, desc, tier)
            for n, bid, label, emoji, desc, tier in thresholds if active_days_30 >= n]

def _time_of_day_badges(sessions_all, session_count):
    """Return badges for preferred study time of day."""
    if session_count == 0:
        return []
    earned = []
    early = sum(1 for s in sessions_all if s.end_time.hour < 10)
    late = sum(1 for s in sessions_all if s.end_time.hour >= 20)
    afternoon = sum(1 for s in sessions_all if 12 <= s.end_time.hour < 17)
    if early / session_count > 0.5:
        earned.append(_badge('early_bird', 'Early Bird', '🌅', 'Over half your sessions before 10am'))
    if late / session_count > 0.5:
        earned.append(_badge('night_owl', 'Night Owl', '🦉', 'Over half your sessions after 8pm'))
    if afternoon / session_count > 0.5:
        earned.append(_badge('afternoon_peak', 'Afternoon Peak', '⚡', 'Over half your sessions 12–5pm'))
    return earned

def _session_length_badges(sessions_all):
    """Return badges for short or long session preferences."""
    earned = []
    short = sum(1 for s in sessions_all if s.duration <= 25)
    long = sum(1 for s in sessions_all if s.duration >= 90)
    if short >= 10:
        earned.append(_badge('sprint_king', 'Sprint King', '⚡', '10+ sessions under 25 minutes'))
    if long >= 10:
        earned.append(_badge('deep_focus', 'Deep Focus', '🧠', '10+ sessions over 90 minutes', 'silver'))
    return earned

def _module_badges(module_count):
    """Return badges for module enrolment breadth."""
    earned = []
    if module_count >= 3:
        earned.append(_badge('multi_module', 'Multi-Module', '🎓', 'Enrolled in 3 or more modules'))
    if module_count >= 5:
        earned.append(_badge('breadth', 'Breadth', '🌐', 'Enrolled in 5 or more modules', 'silver'))
    return earned

def _weekly_goal_badges(sessions_all, user):
    """Return badges for hitting the weekly study goal."""
    now = timezone.now()
    weekly_goal = user.weekly_goal_hours or 20
    week_mins = sum(s.duration for s in sessions_all if s.end_time >= now - timedelta(days=7))
    earned = []
    if week_mins / 60 >= weekly_goal:
        earned.append(_badge('goal_getter', 'Goal Getter', '🎯', 'Hit your weekly study goal', 'silver'))
    if _hit_goal_four_weeks(sessions_all, now, weekly_goal):
        earned.append(_badge('consistent_goals', 'Consistent Goals', '📆',
                             'Hit your weekly goal 4 weeks running', 'gold'))
    return earned

def _week_mins(sessions, wstart, wend):
    """Return total session minutes within a specific week window."""
    return sum(s.duration for s in sessions if wstart <= s.end_time < wend)

def _week_hours_for_offset(sessions, now, offset):
    """Return study hours for a given week offset from now."""
    wstart = now - timedelta(days=7 * (offset + 1))
    wend = now - timedelta(days=7 * offset)
    return _week_mins(sessions, wstart, wend) / 60

def _hit_goal_four_weeks(sessions, now, goal):
    """Check whether the user hit their weekly goal in each of the last 4 weeks."""
    return all(_week_hours_for_offset(sessions, now, o) >= goal for o in range(4))

def _badge(bid, label, emoji, description, tier='bronze'):
    """Build a single badge dict."""
    return {'id': bid, 'label': label, 'emoji': emoji, 'description': description, 'tier': tier}

def _collect_all_badges(sessions_all, session_count, total_hours, longest_streak, active_days, module_count, user):
    earned = []
    earned.extend(_hour_badges(total_hours))
    earned.extend(_session_count_badges(session_count))
    earned.extend(_streak_badges(longest_streak))
    earned.extend(_consistency_badges(active_days))
    earned.extend(_time_of_day_badges(sessions_all, session_count))
    earned.extend(_session_length_badges(sessions_all))
    earned.extend(_module_badges(module_count))
    earned.extend(_weekly_goal_badges(sessions_all, user))
    return earned

def compute_badges(sessions_all, sessions_90, _, longest_streak, module_count, user):
    sessions_all = _filter_complete(sessions_all)
    sessions_90 = _filter_complete(sessions_90)
    _, longest_streak = compute_streaks(sessions_all)
    _, total_hours, session_count = _session_totals(sessions_all)
    active_days = _active_days_last_30(sessions_90)
    return _collect_all_badges(sessions_all, session_count, total_hours, longest_streak, active_days, module_count, user)

def get_weekly_study_hours(sessions_all):
    """Return total study hours in the last 7 days."""
    week_ago = timezone.now() - timedelta(days=7)
    week_sessions = [s for s in sessions_all if s.end_time >= week_ago]
    return round(sum(s.duration for s in week_sessions) / 60, 1)

def get_society_image(society):
    """Resolve primary image from Society or the first related SocietyImage."""
    if society.image:
        return society.image
    first_img = society.images.first()
    return first_img.url if first_img else None

def _resolve_user(request):
    """Return the user to show a profile for (from query param or request.user)."""
    user_id = request.query_params.get('user_id')
    if not user_id:
        return request.user
    from django.shortcuts import get_object_or_404
    return get_object_or_404(User, id=user_id)

def _get_module_count(user):
    """Return module count: taught modules for teachers, enrolments for students."""
    if getattr(user, 'role', None) == 'teacher':
        return Module.objects.filter(created_by=user).count()
    return Enrollment.objects.filter(student=user).count()

def _build_societies_list(user):
    """Return serialised society list for the user's profile."""
    memberships = SocietyMembership.objects.filter(user=user).select_related('society')
    if getattr(user, 'role', None) == 'teacher':
        return []
    return [{'id': m.society.id, 'name': m.society.name, 'image': get_society_image(m.society)}
            for m in memberships]

def _build_connection_ids(user):
    outgoing = CalendarShare.objects.filter(owner=user).values_list('shared_with_id', flat=True)
    incoming = CalendarShare.objects.filter(shared_with=user).values_list('owner_id', flat=True)
    return set(outgoing).union(incoming)

def _build_mutual_connections(viewed_user, viewer, request):
    if not viewer or viewed_user.id == viewer.id:
        return {'count': 0, 'users': []}

    viewer_connections = _build_connection_ids(viewer)
    viewed_connections = _build_connection_ids(viewed_user)
    mutual_ids = sorted((viewer_connections & viewed_connections) - {viewer.id, viewed_user.id})
    if not mutual_ids:
        return {'count': 0, 'users': []}

    users = list(
        User.objects.filter(id__in=mutual_ids)
        .only('id', 'username', 'profile_photo')
        .order_by('username')
    )
    return {
        'count': len(mutual_ids),
        'users': [
            {
                'id': user.id,
                'username': user.username,
                'profile_photo_url': build_profile_photo_url(user.profile_photo, request),
            }
            for user in users[:5]
        ],
    }

def _build_activity_sparkline(sessions):
    days = [timezone.localdate() - timedelta(days=offset) for offset in range(6, -1, -1)]
    totals_by_day = {day: 0 for day in days}
    for session in sessions:
        if not session.end_time:
            continue
        day = timezone.localtime(session.end_time).date()
        if day in totals_by_day:
            totals_by_day[day] += session.duration

    max_minutes = max(totals_by_day.values()) if totals_by_day else 0
    points = []
    for day in days:
        minutes = totals_by_day[day]
        if max_minutes <= 0 or minutes <= 0:
            level = 0
        else:
            level = min(4, max(1, math.ceil((minutes / max_minutes) * 4)))
        points.append({'date': day.isoformat(), 'level': level})
    return points

def _build_profile_response(user, sessions_all, sessions_90, request):
    """Build the profile summary response dict."""
    current_streak, longest_streak = compute_streaks(sessions_all)
    badges = compute_badges(sessions_all, sessions_90, current_streak, longest_streak, _get_module_count(user), user)
    weekly_hours = get_weekly_study_hours(sessions_all)
    weekly_goal = user.weekly_goal_hours or 20
    complete_sessions = _filter_complete(sessions_all)
    _, total_hours, session_count = _session_totals(complete_sessions)
    return {
        'persona': derive_persona(sessions_90),
        'streaks': {'current': current_streak, 'longest': longest_streak},
        'badges': badges,
        'weekly': {
            'hours_studied': weekly_hours,
            'goal_hours': weekly_goal,
            'percentage': min(round((weekly_hours / weekly_goal) * 100), 100) if weekly_goal else 0,
        },
        'societies': _build_societies_list(user),
        'total_hours': round(total_hours, 1),
        'session_count': session_count,
        'activity_sparkline': _build_activity_sparkline(complete_sessions),
        'mutual_connections': _build_mutual_connections(user, request.user, request),
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_summary_view(request):
    """Return persona, streaks, badges, weekly progress, and societies for a user."""
    user = _resolve_user(request)
    sessions_all = list(StudySession.objects.filter(user=user))
    sessions_90 = [s for s in sessions_all if s.end_time >= timezone.now() - timedelta(days=90)]
    return Response(_build_profile_response(user, sessions_all, sessions_90, request))
