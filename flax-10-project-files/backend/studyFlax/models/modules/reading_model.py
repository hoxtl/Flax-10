"""
Model for reading assignments linked to a module with page range and deadline.
"""

from django.db import models
from .module_model import Module

class Reading(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='readings')
    title = models.CharField(max_length=200)
    chapter = models.CharField(max_length=100, blank=True, default='')
    start_page = models.PositiveIntegerField()
    end_page = models.PositiveIntegerField()
    deadline = models.DateTimeField()
    estimated_minutes = models.PositiveIntegerField(null=True, blank=True, help_text='Leave blank to auto-calculate from the page count')
    created_at = models.DateTimeField(auto_now_add=True)

    def page_count(self):
        return max(0, self.end_page - self.start_page + 1)

    def __str__(self):
        return f"{self.module.module_code}: {self.title}"