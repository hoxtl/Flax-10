from django.db import models

from .userModel import User

class UserSettings(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    theme = models.CharField(max_length=50)
    timezone = models.CharField(max_length=100)