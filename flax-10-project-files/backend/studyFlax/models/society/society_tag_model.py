"""
Model for tags belonging to a society, used to categorise announcements and events.
"""

from django.db import models

from .society_model import Society


class SocietyTag(models.Model):
    """Tag used to group society content."""

    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='tags')
    label = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#3b82f6')

    class Meta:
        """Metadata for society tag."""

        unique_together = ('society', 'label')

    def __str__(self):
        return f"{self.society.name} - {self.label}"
