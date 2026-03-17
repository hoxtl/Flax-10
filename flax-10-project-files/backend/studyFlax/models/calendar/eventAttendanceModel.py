"""
Model tracking per-user attendance records for timetable events.
"""
from django.db import models

from ..auth.userModel import User
from .calendarEventModel import CalendarEvent

class EventAttendance(models.Model):
    """One record per user per timetable event: did they attend?"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey(CalendarEvent, on_delete=models.CASCADE)
    attended = models.BooleanField(default=True)
    recorded_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "event"],
                name="unique_user_event_attendance",
            )
        ]

    def __str__(self):
        return f"{self.user} – {self.event.title}: {'attended' if self.attended else 'missed'}"
