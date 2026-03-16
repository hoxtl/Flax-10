from django.db import models

from ..auth.userModel import User
from .societyModel import Society


ROLE_CHOICES = [
    ('member', 'Member'),
    ('editor', 'Editor'),
    ('admin', 'Admin'),
]


class SocietyMembership(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='society_memberships')
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    is_subscribed = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'society')

    def __str__(self):
        return f"{self.user.username} - {self.society.name} ({self.role})"

    @property
    def is_admin(self):
        return self.role in ('admin', 'editor')
