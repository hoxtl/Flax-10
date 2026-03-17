"""
Model representing a university module with schedule and recurrence details.
"""
from django.db import models
from ..auth.userModel import User
from ..calendar.recurrenceRuleModel import RecurrenceRule

class Module(models.Model):
    module_code = models.CharField(max_length=20, unique=True)
    module_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    department = models.CharField(max_length=100, blank=True)
    course = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name="created_modules"
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True, null=True)
    recurrence_rule = models.ForeignKey(RecurrenceRule, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.module_code