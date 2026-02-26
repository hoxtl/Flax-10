from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver
from studyFlax.models.society import SocietyEvent, SocietyAnnouncement, SocietyMembership
from studyFlax.models.notifications.notificationModel import Notification


@receiver(pre_save, sender=SocietyEvent)
def cache_old_event_state(sender, instance, **kwargs):
    if instance.pk:
        instance._is_update = True
    else:
        instance._is_update = False


@receiver(post_save, sender=SocietyEvent)
def notify_members_on_event(sender, instance, created, **kwargs):
    if created:
        notify_society_members(instance.society, build_event_notification(instance, 'new'))
    elif getattr(instance, '_is_update', False):
        notify_society_members(instance.society, build_event_notification(instance, 'updated'))


@receiver(post_save, sender=SocietyAnnouncement)
def notify_members_on_announcement(sender, instance, created, **kwargs):
    if created:
        notify_society_members(instance.society, build_announcement_notification(instance))


@receiver(pre_delete, sender=SocietyAnnouncement)
def handle_announcement_delete(sender, instance, **kwargs):
    has_event = instance.events.exists()
    instance.events.all().delete()
    notify_society_members(instance.society, build_delete_notification(instance, has_event))


def notify_society_members(society, notification_data):
    members = SocietyMembership.objects.filter(society=society).select_related('user')
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
    }


def build_announcement_notification(announcement):
    return {
        'title': f"New announcement from {announcement.society.name}",
        'message': announcement.title,
        'notification_type': 'society_announcement',
        'society_id': announcement.society_id,
    }


def build_delete_notification(announcement, has_event):
    message = f'"{announcement.title}" and its event have been removed' if has_event else f'"{announcement.title}" has been removed'
    return {
        'title': f"Announcement deleted in {announcement.society.name}",
        'message': message,
        'notification_type': 'society_announcement',
        'society_id': announcement.society_id,
    }


def format_event_time(event):
    return event.start_time.strftime('%b %d, %Y at %I:%M %p')
