"""
Auto scheduler preference helpers.
"""


def _resolved_preferences(user, payload):
    settings = getattr(user, "settings", None)
    return {
        "wake_time": payload.get("wake_time") or getattr(settings, "wake_time", None),
        "sleep_time": payload.get("sleep_time") or getattr(settings, "sleep_time", None),
        "week_preference": payload.get("week_preference") or getattr(settings, "week_preference", None),
        "worktime_preference": payload.get("worktime_preference") or getattr(settings, "worktime_preference", None),
    }
