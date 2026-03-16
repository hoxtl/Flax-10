from django.db import models

from ..auth.userModel import User
from .societyModel import Society

class SocietyCalendarSync(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='society_calendar_syncs')
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='calendar_syncs')
    synced_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'society')

    def __str__(self):
        return f"{self.user.username} synced {self.society.name}"
