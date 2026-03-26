"""
Model tracking which users have synced a society's events to their calendar.
"""

from django.db import models

from ..auth.user_model import User
from .society_model import Society


class SocietyCalendarSync(models.Model):
    """Synced society calendar subscription for a user."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='society_calendar_syncs')
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='calendar_syncs')
    synced_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for society calendar sync."""

        unique_together = ('user', 'society')

    def __str__(self):
        return f"{self.user.username} synced {self.society.name}"
