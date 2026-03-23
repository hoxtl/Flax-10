"""
Signals for society event, announcement, membership, and deletion notifications.
"""

from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver
from studyFlax.models.society import Society, SocietyEvent, SocietyAnnouncement, SocietyMembership
from studyFlax.models.notifications.notification_model import Notification

_deleting_societies = set()

@receiver(pre_save, sender=SocietyEvent)
def cache_old_event_state(sender, instance, **kwargs):
    """Flag existing events as updates before saving."""

    instance._is_update = bool(instance.pk)

def _resolve_event_action(instance, created):
    """Return 'new', 'updated', or None depending on the save context."""

    if created:
        return 'new'
    if getattr(instance, '_is_update', False):
        return 'updated'
    return None

@receiver(post_save, sender=SocietyEvent)
def notify_members_on_event(sender, instance, created, **kwargs):
    """Notify subscribed members when a society event is created or updated."""

    if should_skip_notification(instance):
        return
    action = _resolve_event_action(instance, created)
    if action:
        notify_society_members(instance.society, build_event_notification(instance, action))

@receiver(post_save, sender=SocietyAnnouncement)
def notify_members_on_announcement(sender, instance, created, **kwargs):
    """Notify subscribed members when a new announcement is published."""

    if should_skip_notification(instance) or not created:
        return
    notify_society_members(instance.society, build_announcement_notification(instance))

@receiver(pre_delete, sender=SocietyAnnouncement)
def handle_announcement_delete(sender, instance, **kwargs):
    """Notify members and clean up linked events when an announcement is deleted."""

    has_event = instance.events.exists()
    instance.events.all().delete()
    if should_skip_notification(instance):
        return
    notify_society_members(instance.society, build_delete_notification(instance, has_event))

@receiver(pre_delete, sender=SocietyEvent)
def handle_event_delete(sender, instance, **kwargs):
    """Notify members when a society event is cancelled."""

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
    """Fallback handler for deletions outside the API (e.g. Django admin)."""

    if should_skip_notification(instance):
        return
    _deleting_societies.add(instance.pk)
    notify_society_deleted(instance)
    delete_children_silently(instance)

@receiver(pre_delete, sender=SocietyMembership)
def handle_membership_delete(sender, instance, **kwargs):
    """Notify a user when they are removed from a society."""

    if should_skip_notification(instance):
        return
    if instance.society_id in _deleting_societies:
        return
    build_membership_removal_notification(instance.user, instance.society).save()

def notify_society_deleted(society):
    """Send a deletion notification to all members of the society."""

    members = SocietyMembership.objects.filter(society=society).select_related('user')
    notifications = [build_society_delete_notification(m.user, society) for m in members]
    Notification.objects.bulk_create(notifications)

def delete_children_silently(society):
    """Delete all events and announcements without triggering notifications."""

    for event in list(society.events.all()):
        event._skip_notification = True
        event.delete()
    for announcement in list(society.announcements.all()):
        announcement._skip_notification = True
        announcement.delete()

def build_society_delete_notification(user, society):
    """Build a notification for a user whose society has been deleted."""

    return Notification(
        user=user,
        title=f"Society deleted: {society.name}",
        message=f"The society '{society.name}' has been removed. You are no longer a member.",
        notification_type='society_deleted',
    )

def build_membership_removal_notification(user, society):
    """Build a notification for a user who has been removed from a society."""

    return Notification(
        user=user,
        title=f"Removed from {society.name}",
        message=f"You have been removed from {society.name}.",
        notification_type='society_membership',
    )

def should_skip_notification(instance):
    """Return True if this instance has been flagged to suppress notifications."""

    return getattr(instance, '_skip_notification', False)

def notify_society_members(society, notification_data):
    """Bulk-create notifications for all subscribed society members."""

    members = SocietyMembership.objects.filter(
        society=society, is_subscribed=True
    ).select_related('user')
    notifications = [build_notification(m.user, notification_data) for m in members]
    Notification.objects.bulk_create(notifications)

def build_notification(user, data):
    """Construct a Notification instance from a user and a data dict."""

    return Notification(user=user, **data)

def build_event_notification(event, action='new'):
    """Return notification data dict for a created or updated society event."""

    action_text = 'New event' if action == 'new' else 'Event updated'
    return {
        'title': f"{action_text} in {event.society.name}",
        'message': f"{event.title} - {format_event_time(event)}",
        'notification_type': 'society_event',
        'society_id': event.society_id,
        'action_url': build_society_calendar_url(event.society_id),
    }

def build_announcement_notification(announcement):
    """Return notification data dict for a new society announcement."""

    return {
        'title': f"New announcement from {announcement.society.name}",
        'message': announcement.title,
        'notification_type': 'society_announcement',
        'society_id': announcement.society_id,
        'action_url': build_society_announcements_url(announcement.society_id),
        'scroll_to_id': f"announcement-{announcement.id}",
    }

def build_delete_notification(announcement, has_event):
    """Return notification data dict for a deleted society announcement."""

    return {
        'title': f"Announcement deleted in {announcement.society.name}",
        'message': build_delete_message(announcement.title, has_event),
        'notification_type': 'society_announcement',
        'society_id': announcement.society_id,
        'action_url': build_society_announcements_url(announcement.society_id),
    }

def build_delete_message(title, has_event):
    """Return the deletion message, noting any linked event."""

    if has_event:
        return f'"{title}" and its event have been removed'
    return f'"{title}" has been removed'

def build_society_calendar_url(society_id):
    """Return the frontend calendar URL segment for a society."""

    return f"societies_{society_id}_calendar"

def build_society_announcements_url(society_id):
    """Return the frontend announcements URL segment for a society."""

    return f"societies_{society_id}_announcements"

def format_event_time(event):
    """Format the event start time for display in a notification."""

    return event.start_time.strftime('%b %d, %Y at %I:%M %p')
