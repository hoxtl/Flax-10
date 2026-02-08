from django.db import models

class TimetableSource(models.Model):
    source_url = models.URLField(unique=True)
    last_synced = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
