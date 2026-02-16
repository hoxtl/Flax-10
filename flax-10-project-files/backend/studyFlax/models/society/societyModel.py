from django.db import models


class Society(models.Model):
    name = models.CharField(max_length=200)
    bio = models.CharField(max_length=500, blank=True, default="")
    about = models.TextField(blank=True, default="")
    image = models.TextField(blank=True, null=True)
    is_ratified = models.BooleanField(default=False)
    date_created = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "societies"

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.memberships.count()
