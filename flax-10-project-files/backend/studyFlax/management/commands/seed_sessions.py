"""
Orchestrates bulk creation of study sessions and theme sessions.
"""

from django.contrib.auth import get_user_model
from django.db import transaction

from studyFlax.models.timer.session_model import StudySession
from studyFlax.models.timer.theme_session_model import ThemeSession
from .seed_session_helpers import build_study_sessions_for_user, build_theme_sessions_for_user

User = get_user_model()

PROFILES = {
    'johndoe': ('consistent', 'consistent'),
    'janedoe': ('consistent', 'balanced'),
    'charlie': ('night_owl', 'night_owl'),
    'riley':   ('balanced', 'balanced'),
    'nina':    ('consistent', 'consistent'),
    'omar':    ('night_owl', 'balanced'),
    'sofia':   ('balanced', 'consistent'),
    'liamk':   ('consistent', 'consistent'),
    'amiller': ('consistent', 'consistent'),
    'srahwan': ('balanced', 'balanced'),
    'hpatel':  ('consistent', 'consistent'),
    'echen':   ('night_owl', 'night_owl'),
    'jmurphy': ('balanced', 'consistent'),
    'swan':    ('balanced', 'balanced'),
    'rkapoor': ('consistent', 'consistent'),
    'lturner': ('night_owl', 'balanced'),
}


def _get_profile(username):
    """Return (study_profile, theme_profile) for a user."""
    return PROFILES.get(username, ('balanced', 'balanced'))


def _build_user_sessions(user):
    """Build study and theme sessions for a user based on their profile."""
    study_profile, theme_profile = _get_profile(user.username)
    study = build_study_sessions_for_user(user, study_profile)
    theme = build_theme_sessions_for_user(user, theme_profile)
    return study, theme


@transaction.atomic
def create_study_sessions(stdout):
    """Create study and theme sessions for all students."""
    students = list(User.objects.filter(role='student'))
    all_study = []
    all_theme = []
    for user in students:
        study, theme = _build_user_sessions(user)
        all_study.extend(study)
        all_theme.extend(theme)
    StudySession.objects.bulk_create(all_study, ignore_conflicts=True, batch_size=500)
    ThemeSession.objects.bulk_create(all_theme, ignore_conflicts=True, batch_size=500)
    stdout.write(f"  \u2713  {'Sessions':<14} {len(all_study):,} study \u00b7 {len(all_theme):,} theme")
