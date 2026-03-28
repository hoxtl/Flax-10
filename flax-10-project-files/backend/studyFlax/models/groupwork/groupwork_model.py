"""
Models for group projects, memberships, meeting suggestions, and responses.
"""

from django.db import models

from studyFlax.models.auth.user_model import User


class GroupProject(models.Model):
    """Collaborative project shared by a small group."""

    name = models.CharField(max_length=255)
    course_code = models.CharField(max_length=50, blank=True)
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_group_projects",
    )
    deadline = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_seeded = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class GroupMembership(models.Model):
    """Membership record linking a user to a group project."""

    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("member", "Member"),
    ]

    project = models.ForeignKey(
        GroupProject,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="group_memberships",
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="member",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Metadata for group membership."""

        unique_together = ("project", "user")

class MeetingSuggestion(models.Model):
    """Proposed meeting slot for a group project."""

    project = models.ForeignKey(
        GroupProject,
        on_delete=models.CASCADE,
        related_name="suggestions",
    )
    suggested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="made_suggestions",
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Suggestion for {self.project.name} at {self.start_time}"

class MeetingResponse(models.Model):
    """Member response to a suggested meeting slot."""

    STATUS_CHOICES = [
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("pending", "Pending"),
    ]

    suggestion = models.ForeignKey(
        MeetingSuggestion,
        on_delete=models.CASCADE,
        related_name="responses",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="meeting_responses",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Metadata for meeting response."""

        unique_together = ("suggestion", "user")

    def __str__(self):
        return f"{self.user.username} - {self.status} for {self.suggestion}"
