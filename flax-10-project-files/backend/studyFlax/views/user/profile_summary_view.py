from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict

from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.modules.enrollmentModel import Enrollment
from studyFlax.models.society import SocietyMembership


# ---------------------------------------------------------------------------
# Streak helpers
# ---------------------------------------------------------------------------

def compute_streaks(sessions):
    dates = sorted(set(s.end_time.date() for s in sessions))
    if not dates:
        return 0, 0
    longest = current = 1
    for i in range(1, len(dates)):
        if (dates[i] - dates[i - 1]).days == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1
    today = timezone.now().date()
    active_streak = current if dates[-1] >= today - timedelta(days=1) else 0
    return active_streak, longest


# ---------------------------------------------------------------------------
# Study persona derivation
# ---------------------------------------------------------------------------

PERSONAS = [
    {
        'id': 'night_owl',
        'label': 'Night Owl',
        'emoji': '🦉',
        'description': 'You come alive after dark. Your best thinking happens when the world goes quiet.',
    },
    {
        'id': 'early_bird',
        'label': 'Early Bird',
        'emoji': '🌅',
        'description': 'You front-load your day and hit the ground running. Morning hours are your superpower.',
    },
    {
        'id': 'afternoon_peak',
        'label': 'Afternoon Grinder',
        'emoji': '⚡',
        'description': 'Post-lunch is your prime time. You warm up slowly and hit your stride mid-afternoon.',
    },
    {
        'id': 'consistent',
        'label': 'Consistent Scholar',
        'emoji': '📐',
        'description': "You show up every day without fail. Consistency is your edge over everyone else.",
    },
    {
        'id': 'sprint',
        'label': 'Sprint Specialist',
        'emoji': '🚀',
        'description': 'Short, intense bursts. You pack maximum focus into minimum time.',
    },
    {
        'id': 'marathon',
        'label': 'Marathon Runner',
        'emoji': '🏃',
        'description': 'Long sessions, deep focus. You build momentum and ride it all the way.',
    },
]


def derive_persona(sessions):
    if not sessions:
        return PERSONAS[0]

    hour_totals = defaultdict(int)
    durations = []
    for s in sessions:
        hour_totals[s.end_time.hour] += s.duration
        durations.append(s.duration)

    peak_hour = max(hour_totals, key=hour_totals.get)
    avg_duration = sum(durations) / len(durations) if durations else 0

    recent_dates = set(s.end_time.date() for s in sessions
                       if s.end_time >= timezone.now() - timedelta(days=7))
    is_consistent = len(recent_dates) >= 5

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
    if avg_duration >= 75:
        return PERSONAS[5]
    return PERSONAS[2]


# ---------------------------------------------------------------------------
# Badge definitions — full set, computed from all-time sessions
# ---------------------------------------------------------------------------

def compute_badges(sessions_all, sessions_90, _, longest_streak, module_count, user):
    now = timezone.now()

    # Filter out incomplete sessions for badge calculations
    sessions_all = [s for s in sessions_all if s.status != 'Incomplete']
    sessions_90 = [s for s in sessions_90 if s.status != 'Incomplete']
    
    _, longest_streak = compute_streaks(sessions_all)

    # All-time stats
    total_minutes  = sum(s.duration for s in sessions_all)
    total_hours    = total_minutes / 60
    session_count  = len(sessions_all)

    # Last-30-days active days (from 90-day window)
    active_days_30 = len(set(
        s.end_time.date() for s in sessions_90
        if s.end_time >= now - timedelta(days=30)
    ))

    earned = []

    def badge(id, label, emoji, description, tier='bronze'):
        earned.append({
            'id': id, 'label': label, 'emoji': emoji,
            'description': description, 'tier': tier,
        })

    # --- Hours milestones (all-time) ----------------------------------------
    if total_hours >= 1:
        badge('1hr',   'First Hour',      '⏱️', 'Studied for 1 hour total')
    if total_hours >= 10:
        badge('10hr',  'Getting Started', '📖', 'Studied for 10 hours total')
    if total_hours >= 50:
        badge('50hr',  'Dedicated',       '🔥', 'Studied for 50 hours total',   'silver')
    if total_hours >= 100:
        badge('100hr', 'Century',         '💯', '100 hours of focused study',   'gold')
    if total_hours >= 250:
        badge('250hr', 'Scholar',         '🎓', '250 hours of focused study',   'gold')
    if total_hours >= 500:
        badge('500hr', 'Legend',          '👑', '500 hours — you are a legend', 'gold')

    # --- Session count (all-time) --------------------------------------------
    if session_count >= 1:
        badge('sessions_1',   'First Step', '🎯', 'Completed your first study session')
    if session_count >= 10:
        badge('sessions_10',  'Regular',    '🎖️', 'Completed 10 study sessions')
    if session_count >= 50:
        badge('sessions_50',  'Committed',  '🏅', '50 sessions completed',  'silver')
    if session_count >= 100:
        badge('sessions_100', 'Veteran',    '🏆', '100 sessions completed', 'gold')

    # --- Streaks (all-time longest) ------------------------------------------
    if longest_streak >= 3:
        badge('streak_3',  'On a Roll',    '🔥', 'Studied 3 days in a row')
    if longest_streak >= 7:
        badge('streak_7',  'Week Warrior', '⚔️', '7-day study streak',  'silver')
    if longest_streak >= 14:
        badge('streak_14', 'Fortnight',    '🏆', '14-day study streak', 'gold')
    if longest_streak >= 30:
        badge('streak_30', 'Iron Will',    '💎', '30-day study streak', 'gold')

    # --- Consistency — active days in last 30 days ---------------------------
    if active_days_30 >= 10:
        badge('consistent_10', 'Steady Pace',   '📅', 'Active 10 days this month')
    if active_days_30 >= 20:
        badge('consistent_20', 'Month Grind',   '🌟', 'Active 20 days this month',  'silver')
    if active_days_30 >= 28:
        badge('consistent_28', 'Perfectionist', '✨', 'Active 28 days this month',  'gold')

    # --- Time of day (all-time) ----------------------------------------------
    if session_count > 0:
        early     = [s for s in sessions_all if s.end_time.hour < 10]
        late      = [s for s in sessions_all if s.end_time.hour >= 20]
        afternoon = [s for s in sessions_all if 12 <= s.end_time.hour < 17]

        if len(early)     / session_count > 0.5:
            badge('early_bird',     'Early Bird',     '🌅', 'Over half your sessions before 10am')
        if len(late)      / session_count > 0.5:
            badge('night_owl',      'Night Owl',      '🦉', 'Over half your sessions after 8pm')
        if len(afternoon) / session_count > 0.5:
            badge('afternoon_peak', 'Afternoon Peak', '⚡', 'Over half your sessions 12–5pm')

    # --- Session length (all-time) -------------------------------------------
    short_sessions = [s for s in sessions_all if s.duration <= 25]
    long_sessions  = [s for s in sessions_all if s.duration >= 90]

    if len(short_sessions) >= 10:
        badge('sprint_king', 'Sprint King', '⚡', '10+ sessions under 25 minutes')
    if len(long_sessions)  >= 10:
        badge('deep_focus',  'Deep Focus',  '🧠', '10+ sessions over 90 minutes', 'silver')

    # --- Modules -------------------------------------------------------------
    if module_count >= 3:
        badge('multi_module', 'Multi-Module', '🎓', 'Enrolled in 3 or more modules')
    if module_count >= 5:
        badge('breadth',      'Breadth',      '🌐', 'Enrolled in 5 or more modules', 'silver')

    # --- Weekly goal ---------------------------------------------------------
    weekly_goal      = user.weekly_goal_hours or 20
    week_ago         = now - timedelta(days=7)
    weekly_mins      = sum(s.duration for s in sessions_all if s.end_time >= week_ago)
    weekly_hrs       = weekly_mins / 3600

    if weekly_hrs >= weekly_goal:
        badge('goal_getter', 'Goal Getter', '🎯', 'Hit your weekly study goal', 'silver')

    # Hit weekly goal in each of last 4 consecutive weeks
    weeks_hit = 0
    for week_offset in range(4):
        wstart = now - timedelta(days=7 * (week_offset + 1))
        wend   = now - timedelta(days=7 *  week_offset)
        wmins  = sum(s.duration for s in sessions_all if wstart <= s.end_time < wend)
        if wmins / 3600 >= weekly_goal:
            weeks_hit += 1
    if weeks_hit >= 4:
        badge('consistent_goals', 'Consistent Goals', '📆',
              'Hit your weekly goal 4 weeks running', 'gold')

    return earned


# ---------------------------------------------------------------------------
# Weekly goal helpers
# ---------------------------------------------------------------------------

def get_weekly_study_hours(sessions_all):
    week_ago = timezone.now() - timedelta(days=7)
    week_sessions = [s for s in sessions_all if s.end_time >= week_ago]
    return round(sum(s.duration for s in week_sessions) / 3600, 1)


def get_society_image(society):
    """Resolves primary image from Society or the first related SocietyImage."""
    if society.image:
        return society.image
    first_img = society.images.first()
    return first_img.url if first_img else None


# ---------------------------------------------------------------------------
# Main view
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_summary_view(request):
    user_id = request.query_params.get('user_id')
    if user_id:
        from django.shortcuts import get_object_or_404
        from studyFlax.models import User
        user = get_object_or_404(User, id=user_id)
    else:
        user = request.user

    # All-time sessions for accurate badge computation
    sessions_all = list(StudySession.objects.filter(user=user))

    # 90-day window for persona + streak + active days
    sessions_90 = [s for s in sessions_all
                   if s.end_time >= timezone.now() - timedelta(days=90)]

    current_streak, longest_streak = compute_streaks(sessions_all)
    persona = derive_persona(sessions_90)

    module_count = Enrollment.objects.filter(student=user).count()
    badges = compute_badges(
        sessions_all, sessions_90,
        current_streak, longest_streak,
        module_count, user
    )

    weekly_hours = get_weekly_study_hours(sessions_all)
    weekly_goal  = user.weekly_goal_hours or 20

    memberships = SocietyMembership.objects.filter(user=user).select_related('society')
    societies = [
        {
            'id': m.society.id,
            'name': m.society.name,
            'image': get_society_image(m.society),
        } for m in memberships
    ]

    return Response({
        'persona': persona,
        'streaks': {
            'current': current_streak,
            'longest': longest_streak,
        },
        'badges': badges,
        'weekly': {
            'hours_studied': weekly_hours,
            'goal_hours':    weekly_goal,
            'percentage':    min(round((weekly_hours / weekly_goal) * 100), 100) if weekly_goal else 0,
        },
        'societies': societies,
    })