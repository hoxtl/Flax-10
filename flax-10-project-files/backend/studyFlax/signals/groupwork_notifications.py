from django.db.models.signals import post_save
from django.dispatch import receiver
from studyFlax.models.groupwork.groupworkModel import GroupMembership
from studyFlax.models.notifications.notificationModel import Notification

@receiver(post_save, sender=GroupMembership)
def notify_on_added_to_project(sender, instance, created, **kwargs):
    """Notify user when they are added to a group project."""
    if not created:
        return
    
    # Don't notify the owner/creator
    if instance.role == 'owner':
        return

    Notification.objects.create(
        user=instance.user,
        title="Added to Group Project",
        message=f"You have been added to the project: {instance.project.name}",
        notification_type='general',
        action_url=f"group-work_{instance.project.id}"
    )
