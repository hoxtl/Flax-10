from django.db import models
from ..auth.userModel import User

class Module(models.Model):
    module_code = models.CharField(max_length=20, unique=True)
    module_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name="created_modules"
    )

    def __str__(self):
        return self.module_code