"""
Model representing a student's enrollment in a module.
"""

from django.db import models
from ..authentication.user_model import User
from .module_model import Module


class Enrollment(models.Model):
    """Module enrolment linking a user to a class."""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="enrollments")
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    is_core = models.BooleanField(default=False)

    class Meta:
        """Metadata for enrollment."""
        unique_together = ("student", "module")
