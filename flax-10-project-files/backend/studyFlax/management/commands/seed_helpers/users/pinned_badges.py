"""
Seeds a deterministic pinned badge for every user.
"""

import hashlib

from django.contrib.auth import get_user_model


User = get_user_model()

_BADGE_IDS = [
    "1hr", "10hr", "50hr", "100hr",
    "sessions_1", "sessions_10", "sessions_50",
    "streak_3", "streak_7", "streak_14",
    "early_bird", "night_owl", "afternoon_peak",
    "consistent_10", "multi_module",
    "sprint_king", "deep_focus", "goal_getter",
]

_FIXTURE_PINNED = {
    "johndoe": "100hr",
    "janedoe": "consistent_10",
    "charlie": "streak_7",
    "amiller": "deep_focus",
}


def _stable_hash(s):
    return int(hashlib.md5(s.encode()).hexdigest(), 16)

def _pick_badge(username):
    if username in _FIXTURE_PINNED:
        return _FIXTURE_PINNED[username]
    return _BADGE_IDS[_stable_hash(username) % len(_BADGE_IDS)]

def _users_without_pinned_badges():
    return [user for user in User.objects.all() if not user.pinned_badge_id]

def _assign_pinned_badges(users):
    for user in users:
        user.pinned_badge_id = _pick_badge(user.username)
    return users

def seed_pinned_badges(stdout):
    """Assign a deterministic pinned badge to every user that has none."""
    to_update = _assign_pinned_badges(_users_without_pinned_badges())
    if to_update:
        User.objects.bulk_update(to_update, ["pinned_badge_id"])
    stdout.write(f"  \u2713  {'Pinned badges':<14} {len(to_update)}")
