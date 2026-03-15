from django.db import models
from .userModel import User


class CourseChangeRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='course_change_requests',
    )
    requested_course = models.CharField(max_length=100)
    current_course = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return (
            f"{self.user.username}: {self.current_course} → "
            f"{self.requested_course} ({self.status})"
        )
