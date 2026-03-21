"""
Schedule view helpers.
"""

from studyFlax.models import Notification, Schedule

<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def _schedule_queryset(user):
    return Schedule.objects.filter(user=user).prefetch_related("event_allocations__event", "deadline")

def _notify_schedule_overwrite(user, title):
    Notification.objects.create(
        user=user,
        title="Schedule overwritten",
        message=f'Your previous schedule "{title}" has been overwritten by a newer one.',
        notification_type="general",
    )

<<<<<<< HEAD
def _existing_schedules(user, title):
    return list(Schedule.objects.filter(user=user, title=title))

def _delete_schedules(schedules):
    for schedule in schedules:
        schedule.delete()

def _overwrite_same_name_schedules(user, title):
    existing = _existing_schedules(user, title)
    if not existing:
        return False
    _delete_schedules(existing)
=======
def _overwrite_same_name_schedules(user, title):
    existing = list(Schedule.objects.filter(user=user, title=title))
    if not existing:
        return False

    for schedule in existing:
        schedule.delete()
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    _notify_schedule_overwrite(user, title)
    return True
