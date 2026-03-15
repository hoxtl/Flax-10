from django.db import models
from studyFlax.models.auth.userModel import User
from studyFlax.models.modules.moduleModel import Module
from studyFlax.models.groupwork.groupwork_models import GroupProject


class TaskList(models.Model):
    CATEGORY_CHOICES = [
        ('uni', 'University'),
        ('society', 'Society'),
        ('personal', 'Personal'),
        ('private', 'Private'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_lists')
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='personal')
    archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.name}"

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    assigned_to = models.ManyToManyField(User, related_name='assigned_tasks', blank=True)
    group_project = models.ForeignKey(GroupProject, on_delete=models.CASCADE, null=True, blank=True, related_name='tasks')
    task_list = models.ForeignKey(TaskList, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    module = models.ForeignKey(Module, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(
        max_length=20, 
        choices=[('todo', 'To Do'), ('in_progress', 'In Progress'), ('done', 'Done')], 
        default='todo'
    )
    energy_level = models.CharField(
        max_length=10,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
        default='medium',
        blank=True,
        help_text='Cognitive load: Low/Medium/High for burnout prevention',
    )
    due_date = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True, help_text='When the task was marked complete; used for Seeds Grown Today.')
    add_to_calendar = models.BooleanField(default=False)
    time_spent_minutes = models.PositiveIntegerField(default=0)

    estimated_blocks = models.PositiveIntegerField(null=True, blank=True)
    completed_blocks = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title