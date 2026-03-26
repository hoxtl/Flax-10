"""
Model for event tags with colour, icon, and default duration.
"""

from django.db import models

from ..auth.user_model import User
from .category_model import Category


class Tag(models.Model):
    """Custom tag for organising calendar events."""

    name = models.CharField(max_length=50)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    color = models.CharField(max_length=7, default='#9E7E5D')
    icon = models.CharField(max_length=10, default='🏷️')
    is_default = models.BooleanField(default=False)
    default_duration = models.IntegerField(default=60, help_text="Default duration in minutes")

    def __str__(self):
        return self.name
