"""
Model for student societies with ratification status and category metadata.
"""

from django.db import models

RATIFICATION_STATUS = [
    ('none', 'Not Requested'),
    ('pending', 'Pending Approval'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
]

VALID_CATEGORIES = [
    'sports', 'cultural', 'academic', 'arts',
    'social', 'religious', 'volunteering', 'media'
]

class Society(models.Model):
    name = models.CharField(max_length=200)
    bio = models.CharField(max_length=500, blank=True, default="")
    about = models.TextField(blank=True, default="")
    image = models.TextField(blank=True, null=True)
    categories = models.JSONField(default=list, blank=True)
    is_ratified = models.BooleanField(default=False)
    ratification_status = models.CharField(max_length=20, choices=RATIFICATION_STATUS, default='none')
    location = models.CharField(max_length=300, blank=True, default="")
    admin_emails = models.TextField(blank=True, default="")
    date_created = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "societies"

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.memberships.count()

    def save(self, *args, **kwargs):
        if self.ratification_status == 'approved':
            self.is_ratified = True
        super().save(*args, **kwargs)
