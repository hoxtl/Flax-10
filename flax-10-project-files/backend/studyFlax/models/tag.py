from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='B4A490')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    default_duration = models.IntegerField(default=60, help_text='Duration in minutes')
    is_default = models.BooleanField(default=False)
    color = models.CharField(max_length=7, blank=True)

    def save(self, *args, **kwargs):
        if not self.color and self.category:
            self.color = self.category.color
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name