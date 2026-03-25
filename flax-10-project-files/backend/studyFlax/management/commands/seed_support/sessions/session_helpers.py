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

TEACHING_TASK_LABELS = [
    'Lecture prep',
    'Seminar planning',
    'Slides and notes update',
    'Office hours follow-up',
    'Marking and feedback',
    'Module admin catch-up',
    'Reading list refresh',
    'Assessment moderation',
]

STUDY_PROFILES = {
    'night_owl': {
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

ROLE_ACTIVITY_CONFIG = {
    'student': {
        'history_days': 72,
        'daily_session_range': (1, 3),
        'duration_scale': 0.7,
        'duration_jitter': 10,
        'weekend_probability_multiplier': 1.0,
        'skip_day_bonus': 0.0,
        'task_labels': TASK_LABELS,
    },
    'teacher': {
        'history_days': 60,
        'daily_session_range': (1, 2),
        'duration_scale': 0.55,
        'duration_jitter': 6,
        'weekend_probability_multiplier': 0.45,
        'skip_day_bonus': 0.18,
        'task_labels': TEACHING_TASK_LABELS,
    },
}

def _should_skip_day(session_date, config):
    is_weekend = session_date.weekday() >= 5
    if is_weekend:
        return random.random() > config['weekend_probability']
    return random.random() < config['skip_day_prob']

def _build_single_study_session(user, start, work_mins, break_mins, n_sessions, task_labels):
    from studyFlax.models.timer.session_model import StudySession
    status = 'Overtime' if random.random() < 0.08 else 'Completed'
    return StudySession(
        user=user, study_block_id=int(start.timestamp() * 1000),
        start_time=start, end_time=start + timedelta(minutes=work_mins + break_mins),
        duration=work_mins * 60, break_duration=break_mins * 60,
        pause_duration=random.randint(0, max(60, work_mins * 6)),
        session_count=n_sessions, task=random.choice(task_labels),
        status=status,
    )

def _build_session_from_hour(user, session_date, hour, config, activity_config):
    base_mins = int(round(random.choice(config['work_choices']) * activity_config['duration_scale']))
    work_mins = max(20, base_mins + random.randint(-activity_config['duration_jitter'], activity_config['duration_jitter']))
    break_mins = (work_mins // 25) * 5
    start_min = random.randint(0, 3) * 5
    start = session_date.replace(hour=hour, minute=start_min, second=0, microsecond=0)
    return _build_single_study_session(user, start, work_mins, break_mins, max(1, work_mins // 25), activity_config['task_labels'])

def _build_day_study_sessions(user, session_date, config, activity_config):
    count = min(random.randint(*activity_config['daily_session_range']), len(config['preferred_hours']))
    hours = random.sample(config['preferred_hours'], count)
    return [_build_session_from_hour(user, session_date, hour, config, activity_config) for hour in hours]

def build_study_sessions_for_user(user, profile='balanced'):
    """Return realistic StudySession instances for the recent term window."""

    config = STUDY_PROFILES.get(profile, STUDY_PROFILES['balanced'])
    activity_config = ROLE_ACTIVITY_CONFIG.get(getattr(user, 'role', 'student'), ROLE_ACTIVITY_CONFIG['student'])
    adjusted_config = {
        **config,
        'weekend_probability': min(0.95, config['weekend_probability'] * activity_config['weekend_probability_multiplier']),
        'skip_day_prob': min(0.65, config['skip_day_prob'] + activity_config['skip_day_bonus']),
    }
    now = timezone.now()
    dates = [now - timedelta(days=d) for d in range(activity_config['history_days'])]
    active_dates = [d for d in dates if not _should_skip_day(d, adjusted_config)]
    sessions = []
    for session_date in active_dates:
        sessions.extend(_build_day_study_sessions(user, session_date, config, activity_config))
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
