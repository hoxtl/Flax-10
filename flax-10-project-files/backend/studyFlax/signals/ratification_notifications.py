"""
Signals for society ratification status change notifications.
"""

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from studyFlax.models.society import Society, SocietyMembership
from studyFlax.models.notifications.notificationModel import Notification

User = get_user_model()

@receiver(pre_save, sender=Society)
def cache_old_ratification_status(sender, instance, **kwargs):
    instance._old_ratification_status = _fetch_old_status(instance.pk)

def _fetch_old_status(pk):
    if not pk:
        return None
    try:
        return Society.objects.get(pk=pk).ratification_status
    except Society.DoesNotExist:
        return None

@receiver(post_save, sender=Society)
def notify_on_ratification_change(sender, instance, created, **kwargs):
    if getattr(instance, '_skip_notification', False):
        return
    old_status = getattr(instance, '_old_ratification_status', None)
    if old_status == instance.ratification_status:
        return
    _dispatch_ratification_notification(instance, instance.ratification_status)

def _dispatch_ratification_notification(society, new_status):
    if new_status == 'pending':
        notify_admins_pending(society)
        return
    if new_status in ('approved', 'rejected'):
        notify_society_editors(society, new_status)

def notify_admins_pending(society):
    admins = User.objects.filter(is_staff=True)
    notifications = [build_pending_notification(admin, society) for admin in admins]
    Notification.objects.bulk_create(notifications)

def notify_society_editors(society, status):
    editors = get_society_editors(society)
    notifications = [build_status_notification(m.user, society, status) for m in editors]
    Notification.objects.bulk_create(notifications)

def get_society_editors(society):
    return SocietyMembership.objects.filter(
        society=society, role__in=['admin', 'editor']
    ).select_related('user')

def build_pending_notification(admin, society):
    return Notification(
        user=admin,
        title=f"Ratification request: {society.name}",
        message=f"Society '{society.name}' has requested ratification approval.",
        notification_type='ratification_request',
        society_id=society.id,
        action_url='admin',
    )

def build_society_url(society_id):
    return f"societies_{society_id}"

def build_status_notification(user, society, status):
    return Notification(
        user=user,
        title=f"Ratification {status}: {society.name}",
        message=get_status_message(society.name, status),
        notification_type=f'ratification_{status}',
        society_id=society.id,
        action_url=build_society_url(society.id),
    )

def get_status_message(society_name, status):
    if status == 'approved':
        return f"Your society '{society_name}' has been approved for ratification."
    return f"Your society '{society_name}' ratification request was rejected."
