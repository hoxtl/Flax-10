from django.db import models
from .userModel import User

class TodoList(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    todo_name = models.CharField(max_length=200)