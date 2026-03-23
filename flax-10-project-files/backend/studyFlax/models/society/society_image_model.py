"""
Model for images associated with a society, including cover image flag.
"""

from django.db import models

from .society_model import Society

class SocietyImage(models.Model):
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='images')
    url = models.TextField()
    is_cover = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.society.name} - Image {self.id}"
