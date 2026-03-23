"""
Model representing a user's calendar event with recurrence, tags, and priority.
"""

from django.db import models

from ..auth.user_model import User
from ..constants import PRIORITY_CHOICES
from .recurrence_rule_model import RecurrenceRule
from .tag_model import Tag

class CalendarEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    location = models.CharField(max_length=255, blank=True, null=True)
    location_latitude = models.FloatField(blank=True, null=True)
    location_longitude = models.FloatField(blank=True, null=True)
    location_validated = models.BooleanField(default=False)

    tag = models.ForeignKey(Tag, on_delete=models.SET_NULL, null=True, blank=True)
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='low'
    )
    recurrence_rule = models.ForeignKey(RecurrenceRule, on_delete=models.SET_NULL, null=True, blank=True)
    reminder_minutes = models.JSONField(default=list, blank=True)
    source = models.CharField(max_length=100, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)
    module = models.ForeignKey('studyFlax.Module', on_delete=models.CASCADE, null=True, blank=True, related_name='calendar_events')
    is_private = models.BooleanField(default=False)
    location_validated = models.BooleanField(default=False)
