from studyFlax.models import Notification, Schedule

def _schedule_queryset(user):
    return Schedule.objects.filter(user=user).prefetch_related('event_allocations__event', 'deadline')

def _notify_schedule_overwrite(user, title):
    Notification.objects.create(
        user=user,
        title='Schedule overwritten',
        message=f'Your previous schedule "{title}" has been overwritten by a newer one.',
        notification_type='general',
    )

def _overwrite_same_name_schedules(user, title):
    existing = list(Schedule.objects.filter(user=user, title=title))
    if not existing:
        return False

    for schedule in existing:
        schedule.delete()
    _notify_schedule_overwrite(user, title)
    return True
