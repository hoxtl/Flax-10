from django.db import models
from .recurrenceRuleModel import RecurrenceRule
from .userModel import User
from .tagModel import Tag

PRIORITY_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('urgent', 'Urgent'),
]

class CalendarEvent(models.Model):
    # user = models.ForeignKey(User, on_delete=models.CASCADE) # For when we have user authentication
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
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
    recurrence_rule = models.ForeignKey('RecurrenceRule', on_delete=models.SET_NULL, null=True, blank=True)
    reminder_minutes = models.PositiveIntegerField(null=True, blank=True)
    