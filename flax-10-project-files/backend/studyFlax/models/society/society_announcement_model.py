"""
Models for society announcements and their associated images.
"""

from django.db import models

from .society_model import Society
from .society_tag_model import SocietyTag


class SocietyAnnouncement(models.Model):
    """Announcement posted by a society."""
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='announcements')
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True, default="")
    tag = models.ForeignKey(SocietyTag, on_delete=models.SET_NULL, null=True, blank=True)
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Metadata for society announcement."""
        ordering = ['-pinned', '-created_at']

    def __str__(self):
        return f"{self.society.name} - {self.title}"

class SocietyAnnouncementImage(models.Model):
    """Image attached to a society announcement."""
    announcement = models.ForeignKey(
        SocietyAnnouncement, on_delete=models.CASCADE, related_name='images'
    )
    url = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        """Metadata for society announcement image."""
        ordering = ['order']

    def __str__(self):
        return f"Image for {self.announcement.title}"
