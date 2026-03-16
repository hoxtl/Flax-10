from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver
from studyFlax.models.society import Society, SocietyEvent, SocietyAnnouncement, SocietyMembership
from studyFlax.models.notifications.notificationModel import Notification

_deleting_societies = set()


@receiver(pre_save, sender=SocietyEvent)
def cache_old_event_state(sender, instance, **kwargs):
    if instance.pk:
        instance._is_update = True
    else:
        instance._is_update = False


@receiver(post_save, sender=SocietyEvent)
def notify_members_on_event(sender, instance, created, **kwargs):
    if getattr(instance, '_skip_notification', False):
        return
    if created:
        notify_society_members(instance.society, build_event_notification(instance, 'new'))
    elif getattr(instance, '_is_update', False):
        notify_society_members(instance.society, build_event_notification(instance, 'updated'))


@receiver(post_save, sender=SocietyAnnouncement)
def notify_members_on_announcement(sender, instance, created, **kwargs):
    if getattr(instance, '_skip_notification', False):
        return
    if created:
        notify_society_members(instance.society, build_announcement_notification(instance))


@receiver(pre_delete, sender=SocietyAnnouncement)
def handle_announcement_delete(sender, instance, **kwargs):
    has_event = instance.events.exists()
    instance.events.all().delete()
    if should_skip_notification(instance):
        return
    notify_society_members(instance.society, build_delete_notification(instance, has_event))


@receiver(pre_delete, sender=SocietyEvent)
def handle_event_delete(sender, instance, **kwargs):
    if instance.announcement or should_skip_notification(instance):
        return
    notify_society_members(instance.society, {
        'title': f"Event cancelled in {instance.society.name}",
        'message': f'"{instance.title}" has been removed from the calendar.',
        'notification_type': 'society_event',
        'society_id': instance.society_id,
        'action_url': build_society_calendar_url(instance.society_id),
    })


@receiver(pre_delete, sender=Society)
def handle_society_delete(sender, instance, **kwargs):
    """Fallback handler for deletions outside the API (e.g., Django admin)."""
    if getattr(instance, '_skip_notification', False):
        return
    _deleting_societies.add(instance.pk)
    notify_society_deleted(instance)
    delete_children_silently(instance)


@receiver(pre_delete, sender=SocietyMembership)
def handle_membership_delete(sender, instance, **kwargs):
    """Notify user when they are removed (not during society deletion)."""
    if getattr(instance, '_skip_notification', False):
        return
    if instance.society_id in _deleting_societies:
        return
    notification = build_membership_removal_notification(instance.user, instance.society)
    notification.save()


def notify_society_deleted(society):
    """Send deletion notification to all society members."""
    members = SocietyMembership.objects.filter(society=society).select_related('user')
    notifications = [build_society_delete_notification(m.user, society) for m in members]
    Notification.objects.bulk_create(notifications)


def delete_children_silently(society):
    """Delete all events and announcements without notifications."""
    for event in list(society.events.all()):
        event._skip_notification = True
        event.delete()
    for announcement in list(society.announcements.all()):
        announcement._skip_notification = True
        announcement.delete()


def build_society_delete_notification(user, society):
    return Notification(
        user=user,
        title=f"Society deleted: {society.name}",
        message=f"The society '{society.name}' has been removed. You are no longer a member.",
        notification_type='society_deleted',
    )


def build_membership_removal_notification(user, society):
    return Notification(
        user=user,
        title=f"Removed from {society.name}",
        message=f"You have been removed from {society.name}.",
        notification_type='society_membership',
    )


def should_skip_notification(instance):
    """Check if notification should be skipped for this instance."""
    return getattr(instance, '_skip_notification', False)


def notify_society_members(society, notification_data):
    members = SocietyMembership.objects.filter(
        society=society, is_subscribed=True
    ).select_related('user')
    notifications = [build_notification(m.user, notification_data) for m in members]
    Notification.objects.bulk_create(notifications)


def build_notification(user, data):
    return Notification(user=user, **data)


def build_event_notification(event, action='new'):
    action_text = 'New event' if action == 'new' else 'Event updated'
    return {
        'title': f"{action_text} in {event.society.name}",
        'message': f"{event.title} - {format_event_time(event)}",
        'notification_type': 'society_event',
        'society_id': event.society_id,
        'action_url': build_society_calendar_url(event.society_id),
    }


def build_announcement_notification(announcement):
    return {
        'title': f"New announcement from {announcement.society.name}",
        'message': announcement.title,
        'notification_type': 'society_announcement',
        'society_id': announcement.society_id,
        'action_url': build_society_announcements_url(announcement.society_id),
        'scroll_to_id': f"announcement-{announcement.id}",
    }


def build_delete_notification(announcement, has_event):
    message = build_delete_message(announcement.title, has_event)
    return {
        'title': f"Announcement deleted in {announcement.society.name}",
        'message': message,
        'notification_type': 'society_announcement',
        'society_id': announcement.society_id,
        'action_url': build_society_announcements_url(announcement.society_id),
    }


def build_delete_message(title, has_event):
    if has_event:
        return f'"{title}" and its event have been removed'
    return f'"{title}" has been removed'


def build_society_calendar_url(society_id):
    return f"societies_{society_id}_calendar"


def build_society_announcements_url(society_id):
    return f"societies_{society_id}_announcements"


def format_event_time(event):
    return event.start_time.strftime('%b %d, %Y at %I:%M %p')
