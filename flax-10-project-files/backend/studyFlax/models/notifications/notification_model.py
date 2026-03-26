"""
Model for user notifications with type, action URL, and read status.
"""

from django.db import models
from studyFlax.models.authentication.user_model import User


NOTIFICATION_TYPES = [
    ('general', 'General'),
    ('society_event', 'Society Event'),
    ('society_announcement', 'Society Announcement'),
    ('reminder', 'Reminder'),
    ('ratification_request', 'Ratification Request'),
    ('ratification_approved', 'Ratification Approved'),
    ('ratification_rejected', 'Ratification Rejected'),
    ('meeting_suggestion', 'Meeting Suggestion'),
    ('module_deleted', 'Module Deleted'),
    ('module_updated', 'Module Updated'),
]

class Notification(models.Model):
    """Notification shown to a user in the app."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES, default='general')
    society_id = models.IntegerField(null=True, blank=True)
    action_url = models.CharField(max_length=255, null=True, blank=True)
    scroll_to_id = models.CharField(max_length=255, null=True, blank=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for notification."""
        ordering = ['-created_at']

    def __str__(self):
        return self.title
