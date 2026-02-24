from django.db import models
from .calendarEventModel import CalendarEvent
from models.deadlineModel import Deadline
#from models.taskModel import Task

# A wrapper class for all time-management relate instances manifested through calendar.

class Schedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True)
    event = models.ManyToManyField(CalendarEvent, related_name="schedules")
    deadline = models.ManyToManyField(Deadline, related_name="schedules")