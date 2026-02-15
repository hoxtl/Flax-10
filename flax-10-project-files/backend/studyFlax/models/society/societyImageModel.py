from django.db import models

from .societyModel import Society


class SocietyImage(models.Model):
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='images')
    url = models.URLField(max_length=500)
    is_cover = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.society.name} - Image {self.id}"
