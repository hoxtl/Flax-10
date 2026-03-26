"""
Model for calendar sharing relationships between users.
"""

from django.db import models
from django.conf import settings


class CalendarShare(models.Model):
    """Calendar sharing link between two users."""
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sharing_with')
    shared_with = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shared_with_me')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for calendar share."""
        unique_together = ('owner', 'shared_with')
        indexes = [
            models.Index(fields=['owner', 'shared_with']),
        ]

    def __str__(self):
        return f"{self.owner.username} shares with {self.shared_with.username}"
