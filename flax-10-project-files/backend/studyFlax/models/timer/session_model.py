"""
Model for recording individual study sessions with duration and pause tracking.
"""

from django.db import models
from ..auth.user_model import User

class StudySession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_sessions')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration = models.IntegerField(help_text="Duration in seconds")
    pause_duration = models.IntegerField(default=0, help_text="Total pause duration in seconds")
    break_duration = models.IntegerField(default=0, help_text="Break duration in seconds")
    session_count = models.IntegerField(default=0)
    study_block_id = models.BigIntegerField(help_text="Timestamp ID for grouping sessions")
    task = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, default='Completed')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-end_time']

    def __str__(self):
        return f"{self.user.email} - {self.duration}m - {self.end_time}"
