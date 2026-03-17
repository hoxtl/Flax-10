"""
Model storing per-user application settings such as theme, timezone, and sleep schedule.
"""
from datetime import time

from django.db import models

from .userModel import User

class UserSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    theme = models.CharField(max_length=50, default='flax')
    mode = models.CharField(max_length=50, default='light')
    timezone = models.CharField(max_length=100)
    year = models.CharField(max_length=50, blank=True, default='')
    major = models.CharField(max_length=100, blank=True, default='')
    modules = models.JSONField(default=list, blank=True)
    homepage_widgets = models.JSONField(default=list, blank=True)
    sleep_time = models.TimeField(default=time(23, 0))
    wake_time = models.TimeField(default=time(7, 0))
    mode = models.CharField(max_length=50, default='light')
    homepage_widgets = models.JSONField(default=list, blank=True)