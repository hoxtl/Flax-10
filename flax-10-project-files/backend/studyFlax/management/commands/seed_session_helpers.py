"""
Factories for building study sessions and theme sessions.
"""

import random
from datetime import timedelta

from django.utils import timezone

TASK_LABELS = [
    'CS4303 programming assignment',
    'HI4101 essay',
    'MA4201 problem set',
    'PH4102 lab report',
    'Literature review',
    'Revision: data structures',
    'Revision: algorithms',
    'Group project planning',
    'Reply to supervisor email',
    'Plan the week ahead',
    'Past paper practice',
    'Reading week catch-up',
]

STUDY_PROFILES = {
    'night_owl': {
<<<<<<< Updated upstream
        'preferred_hours': [20, 21, 22, 23],
        'weekend_probability': 0.55,
        'skip_day_prob': 0.25,
        'work_choices': [30, 45, 60, 90, 120],
    },
    'consistent': {
        'preferred_hours': [9, 10, 14, 15, 16],
        'weekend_probability': 0.70,
        'skip_day_prob': 0.10,
        'work_choices': [45, 60, 75, 90, 105],
    },
    'balanced': {
        'preferred_hours': [9, 10, 11, 14, 15, 16],
        'weekend_probability': 0.40,
        'skip_day_prob': 0.20,
        'work_choices': [25, 35, 50, 60, 75],
=======
        'preferred_hours': [19, 20, 21, 22, 23],
        'weekend_probability': 0.80,
        'skip_day_prob': 0.10,
        'work_choices': [75, 100, 125, 150],
    },
    'consistent': {
        'preferred_hours': [9, 10, 11, 14, 15, 16],
        'weekend_probability': 0.85,
        'skip_day_prob': 0.05,
        'work_choices': [100, 125, 150, 175],
    },
    'balanced': {
        'preferred_hours': [9, 10, 11, 14, 15, 16, 19],
        'weekend_probability': 0.65,
        'skip_day_prob': 0.12,
        'work_choices': [75, 100, 125, 150],
>>>>>>> Stashed changes
    },
}

THEME_PROFILES = {
    'night_owl': [
        (8, 'light', 30, 90),
        (20, 'dark', 90, 240),
        (22, 'dark', 30, 90),
    ],
    'consistent': [
        (9, 'light', 60, 180),
        (14, 'light', 60, 120),
        (19, 'dark', 30, 90),
    ],
    'balanced': [
        (9, 'light', 60, 180),
        (13, 'light', 30, 90),
        (20, 'dark', 30, 120),
    ],
}

def _should_skip_day(session_date, config):
    is_weekend = session_date.weekday() >= 5
    if is_weekend:
        return random.random() > config['weekend_probability']
    return random.random() < config['skip_day_prob']

def _build_single_study_session(user, start, work_mins, break_mins, n_sessions):
    from studyFlax.models.timer.session_model import StudySession
    status = 'Overtime' if random.random() < 0.08 else 'Completed'
    end = start + timedelta(minutes=work_mins + break_mins)
    pause_secs = random.randint(0, max(60, work_mins * 6))  # 0 to ~10% of work time
    return StudySession(
        user=user,
        study_block_id=int(start.timestamp() * 1000),
        start_time=start,
        end_time=end,
        duration=work_mins * 60,
        break_duration=break_mins * 60,
        pause_duration=pause_secs,
        session_count=n_sessions,
        task=random.choice(TASK_LABELS),
        status=status,
    )

def _build_day_study_sessions(user, session_date, config):
    count = min(random.randint(2, 4), len(config['preferred_hours']))
    hours = random.sample(config['preferred_hours'], count)
    sessions = []
    for hour in hours:
        base_mins = random.choice(config['work_choices'])
        work_mins = max(15, base_mins + random.randint(-8, 8))
        break_mins = (work_mins // 25) * 5
        start_min = random.randint(0, 3) * 5  # start on a 5-min boundary: 0, 5, 10, 15
        start = session_date.replace(hour=hour, minute=start_min, second=0, microsecond=0)
        sessions.append(_build_single_study_session(user, start, work_mins, break_mins, max(1, work_mins // 25)))
    return sessions

def build_study_sessions_for_user(user, profile='balanced'):
    """Return StudySession instances across the past 90 days."""
    config = STUDY_PROFILES.get(profile, STUDY_PROFILES['balanced'])
    now = timezone.now()
    dates = [now - timedelta(days=d) for d in range(120)]
    active_dates = [d for d in dates if not _should_skip_day(d, config)]
    sessions = []
    for session_date in active_dates:
        sessions.extend(_build_day_study_sessions(user, session_date, config))
    return sessions

def _build_single_theme_session(user, base, hour, theme, min_dur, max_dur):
    from studyFlax.models.timer.theme_session_model import ThemeSession
    duration = random.randint(min_dur, max_dur)
    started = base.replace(hour=hour, minute=0, second=0, microsecond=0)
    return ThemeSession(
        user=user, theme=theme,
        started_at=started,
        ended_at=started + timedelta(minutes=duration),
        duration_minutes=duration,
    )

def _theme_sessions_for_day(user, base, slots):
    return [
        _build_single_theme_session(user, base, h, t, mn, mx)
        for h, t, mn, mx in slots
        if random.random() >= 0.15
    ]

def build_theme_sessions_for_user(user, profile='balanced'):
    """Return ThemeSession instances across the past 90 days."""
    slots = THEME_PROFILES.get(profile, THEME_PROFILES['balanced'])
    now = timezone.now()
    sessions = []
    for day_offset in range(120):
        sessions.extend(_theme_sessions_for_day(user, now - timedelta(days=day_offset), slots))
    return sessions
