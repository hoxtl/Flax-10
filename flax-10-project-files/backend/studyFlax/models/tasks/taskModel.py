from django.db import models
from ..todos.todoListModel import TodoList

PRIORITY_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('urgent', 'Urgent'),
]

class Task(models.Model):
    todo_list = models.ForeignKey(TodoList, on_delete=models.CASCADE)
    
    task_name = models.CharField(max_length=200)
    task_description = models.TextField()
    
    is_completed = models.BooleanField(default=False)
    
    category = models.CharField(max_length=100, blank=True, default="")
    
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    
    deadline = models.DateTimeField(null=True, blank=True)
    
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    
    module_code = models.CharField(max_length=50, blank=True, default="")