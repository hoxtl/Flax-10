from django.db import models
from ..auth.userModel import User

class ThemeSession(models.Model):
    THEME_CHOICES = [('light', 'Light'), ('dark', 'Dark')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='theme_sessions')
    theme = models.CharField(max_length=10, choices=THEME_CHOICES)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField()
    duration_minutes = models.IntegerField()

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.email} - {self.theme} - {self.duration_minutes}m"
