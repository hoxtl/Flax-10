"""
Orchestrates bulk creation of study sessions and theme sessions.
"""

from django.contrib.auth import get_user_model

from studyFlax.models.timer.session_model import StudySession
from studyFlax.models.timer.theme_session_model import ThemeSession
from .seed_session_helpers import build_study_sessions_for_user, build_theme_sessions_for_user

User = get_user_model()

PROFILES = {
    'janedoe': ('balanced', 'balanced'),
    'charlie': ('night_owl', 'night_owl'),
    'amiller': ('consistent', 'consistent'),
    'srahwan': ('balanced', 'balanced'),
    'hpatel': ('consistent', 'consistent'),
    'echen': ('night_owl', 'night_owl'),
    'jmurphy': ('balanced', 'consistent'),
    'swan': ('balanced', 'balanced'),
    'rkapoor': ('consistent', 'consistent'),
    'lturner': ('night_owl', 'balanced'),
}

def _new_study_sessions(user, study_profile):
    return [
        s for s in build_study_sessions_for_user(user, study_profile)
        if not StudySession.objects.filter(
            user=user, study_block_id=s.study_block_id,
        ).exists()
    ]

def _new_theme_sessions(user, theme_profile):
    return [
        t for t in build_theme_sessions_for_user(user, theme_profile)
        if not ThemeSession.objects.filter(
            user=user, started_at=t.started_at,
        ).exists()
    ]

def _seed_sessions_for_user(username, study_profile, theme_profile):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return 0, 0
    study_sessions = _new_study_sessions(user, study_profile)
    StudySession.objects.bulk_create(study_sessions, ignore_conflicts=True)
    theme_sessions = _new_theme_sessions(user, theme_profile)
    ThemeSession.objects.bulk_create(theme_sessions, ignore_conflicts=True)
    return len(study_sessions), len(theme_sessions)

def create_study_sessions(stdout):
    stdout.write("Seeding study sessions and theme sessions...")
    total_study = 0
    total_theme = 0
    for username, (study_profile, theme_profile) in PROFILES.items():
        study, theme = _seed_sessions_for_user(username, study_profile, theme_profile)
        total_study += study
        total_theme += theme
    stdout.write(f"  Created {total_study} study sessions, {total_theme} theme sessions.")
