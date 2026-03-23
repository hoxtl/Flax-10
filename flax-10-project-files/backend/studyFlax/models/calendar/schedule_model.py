from django.db import models
from .calendar_event_model import CalendarEvent
from ..modules.deadline_model import Deadline
from ..auth.user_model import User
#from models.taskModel import Task

WORKTIME_PREFERENCE_CHOICES = [
    ('day', 'Day'),
    ('night', 'Night'),
    ('both', 'Both'),
]

WEEK_PREFERENCE_CHOICES = [
    ('weekdays', 'Weekdays'),
    ('weekends', 'Weekends'),
    ('both', 'Both'),
]

# A wrapper class for all time-management relate instances manifested through calendar.

class Schedule(models.Model):
    title = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='schedules')
    event = models.ManyToManyField(CalendarEvent, related_name="schedules", through='ScheduleEventAllocation', blank=True)
    deadline = models.ManyToManyField(Deadline, related_name="schedules", blank=True)
    wake_time = models.TimeField(null=True, blank=True)
    sleep_time = models.TimeField(null=True, blank=True)
    worktime_preference = models.CharField(max_length=10, choices=WORKTIME_PREFERENCE_CHOICES, default='both')
    week_preference = models.CharField(max_length=10, choices=WEEK_PREFERENCE_CHOICES, default='both')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s schedule {self.title}"

    def delete(self, *args, **kwargs):
        generated_event_ids = list(
            CalendarEvent.objects.filter(
                schedule_allocations__schedule=self,
                source='auto_scheduler',
            ).values_list('id', flat=True).distinct()
        )
        super().delete(*args, **kwargs)
        if generated_event_ids:
            CalendarEvent.objects.filter(id__in=generated_event_ids).delete()

#

class ScheduleEventAllocation(models.Model):
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='event_allocations')
    event = models.ForeignKey(CalendarEvent, on_delete=models.CASCADE, related_name='schedule_allocations')
    deadline = models.ForeignKey(Deadline, on_delete=models.CASCADE, related_name='event_allocations', null=True, blank=True)
    allocated_minutes = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('schedule', 'event')

    def __str__(self):
        return f"{self.schedule_id}:{self.deadline_id}:{self.event_id}"
