"""
Model representing a user's calendar event with recurrence, tags, and priority.
"""
from django.db import models

from ..auth.userModel import User
from ..constants import PRIORITY_CHOICES
from .recurrenceRuleModel import RecurrenceRule
from .tagModel import Tag

class CalendarEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True, null=True)
    tag = models.ForeignKey(Tag, on_delete=models.SET_NULL, null=True, blank=True)
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    recurrence_rule = models.ForeignKey(RecurrenceRule, on_delete=models.SET_NULL, null=True, blank=True)
    reminder_minutes = models.JSONField(default=list, blank=True)
    source = models.CharField(max_length=100, null=True, blank=True)
    external_id = models.CharField(max_length=255, null=True, blank=True)
    module = models.ForeignKey('studyFlax.Module', on_delete=models.CASCADE, null=True, blank=True, related_name='calendar_events')
    is_private = models.BooleanField(default=False)
    location_validated = models.BooleanField(default=False)
