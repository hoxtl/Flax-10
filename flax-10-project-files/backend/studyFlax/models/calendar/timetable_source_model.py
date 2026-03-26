"""
Model storing external timetable feed URLs and sync state per user.
"""

from django.db import models
from ..authentication.user_model import User

class TimetableSource(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    source_url = models.URLField()
    last_synced = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'source_url')
