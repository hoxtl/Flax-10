import secrets
from django.db import models
from django.utils import timezone
from datetime import timedelta
from .userModel import User


class ResetPasswordToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    token_used = models.BooleanField(default=False)


    def save_token(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        if not self.expires_at:
            # Set token expiration time in 1 hour from current time
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)
    

    def is_token_valid(self):
        return (not self.token_used and timezone.now() < self.expires_at)
    

    class Meta:
        db_table = 'reset_password_tokens'
        