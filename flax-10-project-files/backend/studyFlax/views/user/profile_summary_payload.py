"""
Payload helpers for the profile summary endpoint.
"""

import math
from datetime import timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone

from studyFlax.models.auth.user_model import User
from studyFlax.models.modules.enrollment_model import Enrollment
from studyFlax.models.modules.module_model import Module
from studyFlax.models.social.share_model import CalendarShare
from studyFlax.models.society import SocietyMembership
from studyFlax.serialisers.common import build_profile_photo_url

from .profile_summary_badges import compute_badges, compute_streaks, derive_persona, filter_complete, get_weekly_study_hours, session_totals


def get_society_image(society):
    if society.image:
        return society.image
    first_image = society.images.first()
    return first_image.url if first_image else None

def resolve_user(request):
    user_id = request.query_params.get('user_id')
    return request.user if not user_id else get_object_or_404(User, id=user_id)

def get_module_count(user):
    if getattr(user, 'role', None) == 'teacher':
        return Module.objects.filter(created_by=user).count()
    return Enrollment.objects.filter(student=user).count()

def build_societies_list(user):
    memberships = SocietyMembership.objects.filter(user=user).select_related('society')
    if getattr(user, 'role', None) == 'teacher':
        return []
    return [serialise_society(membership) for membership in memberships]

def serialise_society(membership):
    society = membership.society
    return {
        'id': society.id,
        'name': society.name,
        'image': get_society_image(society),
        'role': membership.role,
        'is_admin': membership.is_admin,
    }

def build_connection_ids(user):
    outgoing = CalendarShare.objects.filter(owner=user).values_list('shared_with_id', flat=True)
    incoming = CalendarShare.objects.filter(shared_with=user).values_list('owner_id', flat=True)
    return set(outgoing).union(incoming)

def _empty_connections_payload():
    return {'count': 0, 'users': []}

def _mutual_connection_ids(viewed_user, viewer):
    return sorted((build_connection_ids(viewer) & build_connection_ids(viewed_user)) - {viewer.id, viewed_user.id})

def _mutual_connection_users(mutual_ids):
    return User.objects.filter(id__in=mutual_ids).only('id', 'username', 'profile_photo').order_by('username')

def build_mutual_connections(viewed_user, viewer, request):
    if not viewer or viewed_user.id == viewer.id:
        return _empty_connections_payload()
    mutual_ids = _mutual_connection_ids(viewed_user, viewer)
    if not mutual_ids:
        return _empty_connections_payload()
    users = _mutual_connection_users(mutual_ids)
    return {'count': len(mutual_ids), 'users': [serialise_connection(user, request) for user in users[:5]]}

def serialise_connection(user, request):
    return {'id': user.id, 'username': user.username, 'profile_photo_url': build_profile_photo_url(user.profile_photo, request)}

def build_activity_sparkline(sessions):
    days = [timezone.localdate() - timedelta(days=offset) for offset in range(6, -1, -1)]
    totals_by_day = build_daily_totals(days, sessions)
    max_minutes = max(totals_by_day.values()) if totals_by_day else 0
    return [build_sparkline_point(day, totals_by_day[day], max_minutes) for day in days]

def build_daily_totals(days, sessions):
    totals_by_day = {day: 0 for day in days}
    for session in sessions:
        add_session_to_totals(totals_by_day, session)
    return totals_by_day

def add_session_to_totals(totals_by_day, session):
    if not session.end_time:
        return
    day = timezone.localtime(session.end_time).date()
    if day in totals_by_day:
        totals_by_day[day] += session.duration

def build_sparkline_point(day, minutes, max_minutes):
    return {'date': day.isoformat(), 'level': resolve_sparkline_level(minutes, max_minutes)}

def resolve_sparkline_level(minutes, max_minutes):
    if max_minutes <= 0 or minutes <= 0:
        return 0
    return min(4, max(1, math.ceil((minutes / max_minutes) * 4)))

def _compute_session_stats(sessions_all):
    current_streak, longest_streak = compute_streaks(sessions_all)
    complete_sessions = filter_complete(sessions_all)
    _, total_hours, session_count = session_totals(complete_sessions)
    return current_streak, longest_streak, complete_sessions, total_hours, session_count

def _profile_summary_activity(complete):
    total_seconds, total_hours, session_count = session_totals(complete)
    _ = total_seconds
    return {
        'total_hours': round(total_hours, 1),
        'session_count': session_count,
        'activity_sparkline': build_activity_sparkline(complete),
    }

def _profile_summary_social(user, request):
    return {
        'societies': build_societies_list(user),
        'mutual_connections': build_mutual_connections(user, request.user, request),
    }

def _profile_summary_stats(user, sessions_all, sessions_90, current, longest, module_count):
    return {
        'persona': derive_persona(sessions_90),
        'streaks': {'current': current, 'longest': longest},
        'badges': compute_badges(sessions_all, sessions_90, current, longest, module_count, user),
        'weekly': build_weekly_summary(user, sessions_all),
    }

def build_profile_summary(user, sessions_all, sessions_90, request):
    current, longest, complete, _total_hours, _count = _compute_session_stats(sessions_all)
    module_count = get_module_count(user)
    summary = _profile_summary_stats(user, sessions_all, sessions_90, current, longest, module_count)
    summary.update(_profile_summary_activity(complete))
    summary.update(_profile_summary_social(user, request))
    return summary

def build_weekly_summary(user, sessions_all):
    weekly_hours = get_weekly_study_hours(sessions_all)
    weekly_goal = user.weekly_goal_hours or 20
    percentage = min(round((weekly_hours / weekly_goal) * 100), 100) if weekly_goal else 0
    return {'hours_studied': weekly_hours, 'goal_hours': weekly_goal, 'percentage': percentage}
