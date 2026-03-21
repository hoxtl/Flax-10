"""
Backend tests for task detail and completion behaviour.
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.models.tasks.task_model import Task
<<<<<<< HEAD
from studyFlax.tests.helpers.test_model_builders import make_task, make_user
=======
from studyFlax.tests.helpers.factories import make_task, make_user
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)


class TaskDetailViewTest(TestCase):
    """Tests for task detail view."""

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.task = make_task(self.user, 'My Task')

    def test_patch_task(self):
        response = self.client.patch(f'/api/tasks/{self.task.id}/', {'title': 'Updated Task'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Task')

    def test_patch_task_invalid_payload(self):
        response = self.client.patch(f'/api/tasks/{self.task.id}/', {'title': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_task_not_found(self):
        response = self.client.patch('/api/tasks/99999/', {'title': 'X'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_task(self):
        response = self.client.delete(f'/api/tasks/{self.task.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=self.task.id).exists())

    def test_delete_task_also_removes_calendar_event(self):
        due = timezone.now() + timedelta(days=1)
        task = make_task(self.user, 'Scheduled', due_date=due)
        CalendarEvent.objects.create(
            user=self.user, source='task', external_id=str(task.id),
            title='Scheduled', start_time=due, end_time=due + timedelta(minutes=25)
        )
        response = self.client.delete(f'/api/tasks/{task.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            CalendarEvent.objects.filter(source='task', external_id=str(task.id)).exists()
        )

    def test_cannot_delete_other_users_task(self):
        other = make_user('other3', 'other3@example.com')
        other_task = make_task(other, 'Other Task')
        response = self.client.delete(f'/api/tasks/{other_task.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_task_complete_removes_calendar_event(self):
        due = timezone.now() + timedelta(days=1)
        task = make_task(self.user, 'Completable', due_date=due)
        CalendarEvent.objects.create(
            user=self.user, source='task', external_id=str(task.id),
            title='Completable', start_time=due, end_time=due + timedelta(minutes=25)
        )
        response = self.client.patch(f'/api/tasks/{task.id}/', {'completed': True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            CalendarEvent.objects.filter(source='task', external_id=str(task.id)).exists()
        )

    def test_patch_task_add_due_date_creates_calendar_event(self):
        due = (timezone.now() + timedelta(days=3)).isoformat()
        response = self.client.patch(f'/api/tasks/{self.task.id}/', {'due_date': due})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            CalendarEvent.objects.filter(source='task', external_id=str(self.task.id)).exists()
        )

    def test_patch_task_updates_existing_calendar_event(self):
        due = timezone.now() + timedelta(days=1)
        task = make_task(self.user, 'Updatable', due_date=due)
        CalendarEvent.objects.create(
            user=self.user, source='task', external_id=str(task.id),
            title='Updatable', start_time=due, end_time=due + timedelta(minutes=25)
        )
        new_due = (timezone.now() + timedelta(days=5)).isoformat()
        response = self.client.patch(f'/api/tasks/{task.id}/', {'title': 'Renamed', 'due_date': new_due})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            CalendarEvent.objects.filter(source='task', external_id=str(task.id)).count(), 1
        )
