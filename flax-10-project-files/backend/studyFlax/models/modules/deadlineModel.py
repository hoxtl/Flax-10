"""
Model for module assessment deadlines such as exams, coursework, and quizzes.
"""
from django.db import models
from .moduleModel import Module

DEADLINE_TYPES = [
    ('exam', 'Exam'),
    ('coursework', 'Coursework'),
    ('quiz', 'Quiz'),
    ('presentation', 'Presentation'),
]

class Deadline(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='deadlines')
    title = models.CharField(max_length=200)
    deadline_type = models.CharField(max_length=20, choices=DEADLINE_TYPES)
    description = models.TextField(blank=True, default="")
    start_due_date = models.DateTimeField()
    end_due_date = models.DateTimeField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.module.module_code}: {self.title}"