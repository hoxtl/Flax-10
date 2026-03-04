from django.db import models
from ..auth.userModel import User
from ..modules.moduleModel import Module
from .taskListModel import TaskList

PRIORITY_CHOICES = [
    ("low", "Low"),
    ("medium", "Medium"),
    ("high", "High"),
    ("urgent", "Urgent"),
]


class Task(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    task_list = models.ForeignKey(
        TaskList, on_delete=models.CASCADE, null=True, blank=True, related_name="tasks"
    )
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, null=True, blank=True, related_name="tasks"
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    completed = models.BooleanField(default=False)
    due_date = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="medium"
    )
    estimated_blocks = models.PositiveIntegerField(null=True, blank=True)
    completed_blocks = models.PositiveIntegerField(default=0)
    time_spent_minutes = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    energy_level = models.CharField(max_length=10, default="medium")
    add_to_calendar = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-due_date", "id"]

    def __str__(self):
        return self.title[:50]
