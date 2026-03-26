"""
Model for password reset tokens with expiry and usage tracking.
"""

import secrets
from django.db import models
from django.utils import timezone
from datetime import timedelta
from .user_model import User


class ResetPasswordToken(models.Model):
    """Password reset token issued to a user."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    token_used = models.BooleanField(default=False)

    @classmethod
    def create_user_token(cls, user):
        return cls.objects.create(user=user, token=secrets.token_urlsafe(32), expires_at=timezone.now() + timedelta(hours=1))

    def is_token_valid(self):
        return (not self.token_used and timezone.now() < self.expires_at)

    class Meta:
        """Metadata for reset password token."""
        db_table = 'reset_password_tokens'
