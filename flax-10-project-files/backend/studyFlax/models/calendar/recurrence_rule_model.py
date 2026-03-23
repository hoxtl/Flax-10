"""
Model defining recurrence rules for repeating calendar events.
"""

from django.db import models

class RecurrenceRule(models.Model):
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES)
    interval = models.PositiveIntegerField(default=1)
    end_date = models.DateField(null=True, blank=True)
    count = models.PositiveIntegerField(null=True, blank=True)
    exception_dates = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.frequency} every {self.interval}"