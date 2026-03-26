"""
Model for society events with recurrence and optional announcement link.
"""

from django.db import models

from .society_model import Society
from .society_tag_model import SocietyTag
from .society_announcement_model import SocietyAnnouncement


RECURRENCE_CHOICES = [
    ('none', 'None'),
    ('daily', 'Daily'),
    ('weekly', 'Weekly'),
    ('biweekly', 'Biweekly'),
    ('monthly', 'Monthly'),
    ('yearly', 'Yearly'),
]

class SocietyEvent(models.Model):
    """Event organised by a society."""
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    location = models.CharField(max_length=255, blank=True, default="")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    all_day = models.BooleanField(default=False)
    tag = models.ForeignKey(SocietyTag, on_delete=models.SET_NULL, null=True, blank=True)
    recurrence = models.CharField(max_length=20, choices=RECURRENCE_CHOICES, default='none')
    recurrence_end_date = models.DateField(null=True, blank=True)
    announcement = models.ForeignKey(
        SocietyAnnouncement, on_delete=models.SET_NULL, null=True, blank=True, related_name='events'
    )
    exception_dates = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for society event."""
        ordering = ['start_time']

    def __str__(self):
        return f"{self.society.name} - {self.title}"
