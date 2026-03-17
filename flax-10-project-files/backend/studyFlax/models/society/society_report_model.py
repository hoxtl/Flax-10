"""
Model for user-submitted reports against a society.
"""
from django.db import models
from .society_model import Society
from django.conf import settings

class SocietyReport(models.Model):
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='society_reports_submitted')
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report for {self.society.name} by {self.reporter.username}"
