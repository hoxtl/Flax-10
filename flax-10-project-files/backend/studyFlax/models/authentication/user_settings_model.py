"""
Model storing per-user application settings such as theme, timezone, and sleep schedule.
"""

from datetime import time

from django.db import models

from .user_model import User

class UserSettings(models.Model):
    WEEK_PREFERENCE_CHOICES = [
        ('weekdays', 'Weekdays'),
        ('weekends', 'Weekends'),
        ('both', 'Both'),
    ]
    WORKTIME_PREFERENCE_CHOICES = [
        ('day', 'Day'),
        ('night', 'Night'),
        ('both', 'Both'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    theme = models.CharField(max_length=50, default='flax')
    mode = models.CharField(max_length=50, default='light')
    timezone = models.CharField(max_length=100)
    year = models.CharField(max_length=50, blank=True, default='')
    major = models.CharField(max_length=100, blank=True, default='')
    modules = models.JSONField(default=list, blank=True)
    homepage_widgets = models.JSONField(default=list, blank=True)
    homepage_widget_sizes = models.JSONField(default=dict, blank=True)
    sleep_time = models.TimeField(default=time(23, 0))
    wake_time = models.TimeField(default=time(7, 0))
    preferred_study_minutes_per_day = models.PositiveIntegerField(default=120)
    week_preference = models.CharField(max_length=10, choices=WEEK_PREFERENCE_CHOICES, default='both')
    worktime_preference = models.CharField(max_length=10, choices=WORKTIME_PREFERENCE_CHOICES, default='both')
