from django.db import models
from studyFlax.models.auth.userModel import User


NOTIFICATION_TYPES = [
    ('general', 'General'),
    ('society_event', 'Society Event'),
    ('society_announcement', 'Society Announcement'),
    ('reminder', 'Reminder'),
]


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES, default='general')
    society_id = models.IntegerField(null=True, blank=True)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
