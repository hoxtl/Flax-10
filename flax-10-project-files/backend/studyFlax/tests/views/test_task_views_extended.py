"""
Extended tests for task view helper functions.
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models.tasks.taskModel import Task

from django.contrib.auth import get_user_model

User = get_user_model()


def make_user(username='taskuser_ext', email='taskext@example.com'):
    return User.objects.create_user(username=username, email=email, password='pass')


def make_task(user, title='Test Task', task_list=None, priority='medium',
              completed=False, due_date=None, estimated_blocks=None):
    return Task.objects.create(
        user=user, title=title, task_list=task_list,
        priority=priority, completed=completed,
        due_date=due_date, estimated_blocks=estimated_blocks,
    )


class SyncCalendarEventForTaskTest(TestCase):
    """Unit tests for the sync_calendar_event_for_task helper."""

    def setUp(self):
        self.user = make_user()

    def test_sync_creates_event_for_task_with_due_date(self):
        from studyFlax.views.tasks.task_views import sync_calendar_event_for_task
        due = timezone.now() + timedelta(days=1)
        task = make_task(self.user, 'Due Task', due_date=due)
        sync_calendar_event_for_task(task)
        self.assertTrue(
            CalendarEvent.objects.filter(source='task', external_id=str(task.id)).exists()
        )

    def test_sync_deletes_event_when_completed(self):
        from studyFlax.views.tasks.task_views import sync_calendar_event_for_task
        due = timezone.now() + timedelta(days=1)
        task = make_task(self.user, 'Completed', due_date=due, completed=True)
        CalendarEvent.objects.create(
            user=self.user, source='task', external_id=str(task.id),
            title='Completed', start_time=due, end_time=due + timedelta(minutes=25)
        )
        sync_calendar_event_for_task(task)
        self.assertFalse(
            CalendarEvent.objects.filter(source='task', external_id=str(task.id)).exists()
        )

    def test_sync_deletes_event_when_no_due_date(self):
        from studyFlax.views.tasks.task_views import sync_calendar_event_for_task
        due = timezone.now() + timedelta(days=1)
        task = make_task(self.user, 'NoDue')
        CalendarEvent.objects.create(
            user=self.user, source='task', external_id=str(task.id),
            title='NoDue', start_time=due, end_time=due + timedelta(minutes=25)
        )
        sync_calendar_event_for_task(task)
        self.assertFalse(
            CalendarEvent.objects.filter(source='task', external_id=str(task.id)).exists()
        )

    def test_sync_uses_estimated_blocks_for_duration(self):
        from studyFlax.views.tasks.task_views import sync_calendar_event_for_task
        due = timezone.now() + timedelta(days=1)
        task = make_task(self.user, 'Blocks', due_date=due, estimated_blocks=4)
        sync_calendar_event_for_task(task)
        event = CalendarEvent.objects.get(source='task', external_id=str(task.id))
        duration = (event.end_time - event.start_time).seconds // 60
        self.assertEqual(duration, 100)

    def test_sync_updates_existing_event(self):
        from studyFlax.views.tasks.task_views import sync_calendar_event_for_task
        due = timezone.now() + timedelta(days=1)
        task = make_task(self.user, 'Existing', due_date=due)
        CalendarEvent.objects.create(
            user=self.user, source='task', external_id=str(task.id),
            title='Old Title', start_time=due, end_time=due + timedelta(minutes=25)
        )
        task.title = 'New Title'
        task.save()
        sync_calendar_event_for_task(task)
        self.assertEqual(
            CalendarEvent.objects.filter(source='task', external_id=str(task.id)).count(), 1
        )
