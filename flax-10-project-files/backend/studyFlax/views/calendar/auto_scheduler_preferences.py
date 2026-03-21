"""
Auto scheduler preference helpers.
"""

<<<<<<< HEAD
=======

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def _resolved_preferences(user, payload):
    settings = getattr(user, "settings", None)
    return {
        "wake_time": payload.get("wake_time") or getattr(settings, "wake_time", None),
        "sleep_time": payload.get("sleep_time") or getattr(settings, "sleep_time", None),
<<<<<<< HEAD
        "week_preference": payload.get("week_preference") or getattr(settings, "week_preference", None) or "both",
        "worktime_preference": payload.get("worktime_preference") or getattr(settings, "worktime_preference", None) or "both",
=======
        "week_preference": payload.get("week_preference") or getattr(settings, "week_preference", None),
        "worktime_preference": payload.get("worktime_preference") or getattr(settings, "worktime_preference", None),
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    }
