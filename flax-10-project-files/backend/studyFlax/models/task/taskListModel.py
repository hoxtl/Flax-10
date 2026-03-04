from django.db import models
from ..auth.userModel import User


class TaskList(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="task_lists")
    name = models.CharField(max_length=200)
    color = models.CharField(max_length=32, blank=True, null=True)
    archived = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.name
