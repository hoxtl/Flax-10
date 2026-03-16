from django.db import models

from .societyModel import Society

class SocietyTag(models.Model):
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='tags')
    label = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#3b82f6')

    class Meta:
        unique_together = ('society', 'label')

    def __str__(self):
        return f"{self.society.name} - {self.label}"
