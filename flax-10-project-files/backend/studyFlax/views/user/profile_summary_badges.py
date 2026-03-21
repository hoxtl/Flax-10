"""
Persona and badge helpers for the profile summary endpoint.
"""

from datetime import timedelta

from django.utils import timezone

from studyFlax.views.analytics.session_analytics_service import compute_peak_hour, compute_recent_active_days, compute_streaks

PERSONAS = [
    {'id': 'night_owl', 'label': 'Night Owl', 'emoji': '🦉', 'description': 'You come alive after dark. Your best thinking happens when the world goes quiet.'},
    {'id': 'early_bird', 'label': 'Early Bird', 'emoji': '🌅', 'description': 'You front-load your day and hit the ground running. Morning hours are your superpower.'},
    {'id': 'afternoon_peak', 'label': 'Afternoon Grinder', 'emoji': '⚡', 'description': 'Post-lunch is your prime time. You warm up slowly and hit your stride mid-afternoon.'},
    {'id': 'consistent', 'label': 'Consistent Scholar', 'emoji': '📐', 'description': "You show up every day without fail. Consistency is your edge over everyone else."},
    {'id': 'sprint', 'label': 'Sprint Specialist', 'emoji': '🚀', 'description': 'Short, intense bursts. You pack maximum focus into minimum time.'},
    {'id': 'marathon', 'label': 'Marathon Runner', 'emoji': '🏃', 'description': 'Long sessions, deep focus. You build momentum and ride it all the way.'},
]


def derive_persona(sessions):
    if not sessions:
        return PERSONAS[0]
    peak_hour, avg_duration, is_consistent = collect_session_stats(sessions)
    if is_consistent:
        return PERSONAS[3]
    if peak_hour >= 20 or peak_hour < 4:
        return PERSONAS[0]
    if peak_hour < 10:
        return PERSONAS[1]
    if 12 <= peak_hour < 17:
        return PERSONAS[2]
    return PERSONAS[4] if avg_duration <= 30 else PERSONAS[5] if avg_duration >= 75 else PERSONAS[2]


def collect_session_stats(sessions):
    peak_hour = compute_peak_hour(sessions)
    avg_duration = sum(session.duration for session in sessions) / len(sessions) if sessions else 0
    return peak_hour, avg_duration, compute_recent_active_days(sessions, 7) >= 5


def filter_complete(sessions):
    return [session for session in sessions if session.status != 'Incomplete']


def session_totals(sessions):
    total_minutes = sum(session.duration for session in sessions)
    return total_minutes, total_minutes / 60, len(sessions)


def active_days_last_30(sessions_90):
    cutoff = timezone.now() - timedelta(days=30)
    return len({session.end_time.date() for session in sessions_90 if session.end_time >= cutoff})


def badge(badge_id, label, emoji, description, tier='bronze'):
    return {'id': badge_id, 'label': label, 'emoji': emoji, 'description': description, 'tier': tier}


def badges_for_thresholds(value, thresholds):
    return [badge(badge_id, label, emoji, description, tier) for threshold, badge_id, label, emoji, description, tier in thresholds if value >= threshold]


def hour_badges(total_hours):
    thresholds = [(1, '1hr', 'First Hour', '⏱️', 'Studied for 1 hour total', 'bronze'), (10, '10hr', 'Getting Started', '📖', 'Studied for 10 hours total', 'bronze'), (50, '50hr', 'Dedicated', '🔥', 'Studied for 50 hours total', 'silver'), (100, '100hr', 'Century', '💯', '100 hours of focused study', 'gold'), (250, '250hr', 'Scholar', '🎓', '250 hours of focused study', 'gold'), (500, '500hr', 'Legend', '👑', '500 hours — you are a legend', 'gold')]
    return badges_for_thresholds(total_hours, thresholds)


def session_count_badges(count):
    thresholds = [(1, 'sessions_1', 'First Step', '🎯', 'Completed your first study session', 'bronze'), (10, 'sessions_10', 'Regular', '🎖️', 'Completed 10 study sessions', 'bronze'), (50, 'sessions_50', 'Committed', '🏅', '50 sessions completed', 'silver'), (100, 'sessions_100', 'Veteran', '🏆', '100 sessions completed', 'gold')]
    return badges_for_thresholds(count, thresholds)


def streak_badges(longest_streak):
    thresholds = [(3, 'streak_3', 'On a Roll', '🔥', 'Studied 3 days in a row', 'bronze'), (7, 'streak_7', 'Week Warrior', '⚔️', '7-day study streak', 'silver'), (14, 'streak_14', 'Fortnight', '🏆', '14-day study streak', 'gold'), (30, 'streak_30', 'Iron Will', '💎', '30-day study streak', 'gold')]
    return badges_for_thresholds(longest_streak, thresholds)


def consistency_badges(active_days_30):
    thresholds = [(10, 'consistent_10', 'Steady Pace', '📅', 'Active 10 days this month', 'bronze'), (20, 'consistent_20', 'Month Grind', '🌟', 'Active 20 days this month', 'silver'), (28, 'consistent_28', 'Perfectionist', '✨', 'Active 28 days this month', 'gold')]
    return badges_for_thresholds(active_days_30, thresholds)


def time_of_day_badges(sessions_all, session_count):
    if session_count == 0:
        return []
    early = sum(1 for session in sessions_all if session.end_time.hour < 10)
    late = sum(1 for session in sessions_all if session.end_time.hour >= 20)
    afternoon = sum(1 for session in sessions_all if 12 <= session.end_time.hour < 17)
    return build_time_of_day_badges(early, late, afternoon, session_count)


def build_time_of_day_badges(early, late, afternoon, session_count):
    earned = []
    if early / session_count > 0.5:
        earned.append(badge('early_bird', 'Early Bird', '🌅', 'Over half your sessions before 10am'))
    if late / session_count > 0.5:
        earned.append(badge('night_owl', 'Night Owl', '🦉', 'Over half your sessions after 8pm'))
    if afternoon / session_count > 0.5:
        earned.append(badge('afternoon_peak', 'Afternoon Peak', '⚡', 'Over half your sessions 12–5pm'))
    return earned


def session_length_badges(sessions_all):
    short_sessions = sum(1 for session in sessions_all if session.duration <= 25)
    long_sessions = sum(1 for session in sessions_all if session.duration >= 90)
    return build_session_length_badges(short_sessions, long_sessions)


def build_session_length_badges(short_sessions, long_sessions):
    earned = []
    if short_sessions >= 10:
        earned.append(badge('sprint_king', 'Sprint King', '⚡', '10+ sessions under 25 minutes'))
    if long_sessions >= 10:
        earned.append(badge('deep_focus', 'Deep Focus', '🧠', '10+ sessions over 90 minutes', 'silver'))
    return earned


def module_badges(module_count):
    earned = []
    if module_count >= 3:
        earned.append(badge('multi_module', 'Multi-Module', '🎓', 'Enrolled in 3 or more modules'))
    if module_count >= 5:
        earned.append(badge('breadth', 'Breadth', '🌐', 'Enrolled in 5 or more modules', 'silver'))
    return earned


def weekly_goal_badges(sessions_all, user):
    now = timezone.now()
    weekly_goal = user.weekly_goal_hours or 20
    week_minutes = sum(session.duration for session in sessions_all if session.end_time >= now - timedelta(days=7))
    return build_weekly_goal_badges(sessions_all, now, weekly_goal, week_minutes)


def build_weekly_goal_badges(sessions_all, now, weekly_goal, week_minutes):
    earned = []
    if week_minutes / 3600 >= weekly_goal:
        earned.append(badge('goal_getter', 'Goal Getter', '🎯', 'Hit your weekly study goal', 'silver'))
    if hit_goal_four_weeks(sessions_all, now, weekly_goal):
        earned.append(badge('consistent_goals', 'Consistent Goals', '📆', 'Hit your weekly goal 4 weeks running', 'gold'))
    return earned


def week_minutes(sessions, week_start, week_end):
    return sum(session.duration for session in sessions if week_start <= session.end_time < week_end)


def week_hours_for_offset(sessions, now, offset):
    week_start = now - timedelta(days=7 * (offset + 1))
    week_end = now - timedelta(days=7 * offset)
    return week_minutes(sessions, week_start, week_end) / 3600


def hit_goal_four_weeks(sessions, now, goal):
    return all(week_hours_for_offset(sessions, now, offset) >= goal for offset in range(4))


def collect_all_badges(sessions_all, session_count, total_hours, longest_streak, active_days, module_count, user):
    earned = []
    earned.extend(hour_badges(total_hours))
    earned.extend(session_count_badges(session_count))
    earned.extend(streak_badges(longest_streak))
    earned.extend(consistency_badges(active_days))
    earned.extend(time_of_day_badges(sessions_all, session_count))
    earned.extend(session_length_badges(sessions_all))
    earned.extend(module_badges(module_count))
    earned.extend(weekly_goal_badges(sessions_all, user))
    return earned


def compute_badges(sessions_all, sessions_90, _, longest_streak, module_count, user):
    complete_sessions = filter_complete(sessions_all)
    recent_complete_sessions = filter_complete(sessions_90)
    _, longest_streak = compute_streaks(complete_sessions)
    _, total_hours, session_count = session_totals(complete_sessions)
    active_days = active_days_last_30(recent_complete_sessions)
    return collect_all_badges(complete_sessions, session_count, total_hours, longest_streak, active_days, module_count, user)


def get_weekly_study_hours(sessions_all):
    week_ago = timezone.now() - timedelta(days=7)
    week_sessions = [session for session in sessions_all if session.end_time >= week_ago]
    return round(sum(session.duration for session in week_sessions) / 3600, 1)
