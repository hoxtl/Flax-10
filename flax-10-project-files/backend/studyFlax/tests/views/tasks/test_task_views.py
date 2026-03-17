"""
Backend tests for task views.
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.tasks.taskModel import Task, TaskList
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.tests.helpers.factories import make_user, make_task_list, make_task

class TaskListListViewTest(TestCase):
    """Tests for task list list view."""
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_get_task_lists(self):
        make_task_list(self.user, 'List A')
        make_task_list(self.user, 'List B')
        response = self.client.get('/api/tasks/lists/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_task_lists_excludes_archived(self):
        make_task_list(self.user, 'Active')
        make_task_list(self.user, 'Archived', archived=True)
        response = self.client.get('/api/tasks/lists/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Active')

    def test_get_archived_task_lists(self):
        make_task_list(self.user, 'Active')
        make_task_list(self.user, 'Archived', archived=True)
        response = self.client.get('/api/tasks/lists/?archived=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Archived')

    def test_get_task_lists_only_own(self):
        other = make_user('other', 'other@example.com')
        make_task_list(other, 'Other List')
        make_task_list(self.user, 'My List')
        response = self.client.get('/api/tasks/lists/')
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'My List')

    def test_create_task_list(self):
        response = self.client.post('/api/tasks/lists/', {'name': 'New List', 'category': 'uni'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New List')
        self.assertTrue(TaskList.objects.filter(user=self.user, name='New List').exists())

    def test_create_task_list_invalid(self):
        response = self.client.post('/api/tasks/lists/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/tasks/lists/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class TaskListDetailViewTest(TestCase):
    """Tests for task list detail view."""
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.task_list = make_task_list(self.user, 'Work')

    def test_patch_task_list(self):
        response = self.client.patch(f'/api/tasks/lists/{self.task_list.id}/', {'name': 'Updated'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated')

    def test_patch_task_list_invalid(self):
        response = self.client.patch(f'/api/tasks/lists/{self.task_list.id}/', {'name': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_task_list(self):
        response = self.client.delete(f'/api/tasks/lists/{self.task_list.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TaskList.objects.filter(id=self.task_list.id).exists())

    def test_delete_task_list_not_found(self):
        response = self.client.delete('/api/tasks/lists/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_access_other_users_list(self):
        other = make_user('other', 'other@example.com')
        other_list = make_task_list(other, 'Other')
        response = self.client.delete(f'/api/tasks/lists/{other_list.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_restore_from_archive_completes_tasks(self):
        self.task_list.archived = True
        self.task_list.save()
        task = make_task(self.user, task_list=self.task_list, completed=False)
        response = self.client.patch(
            f'/api/tasks/lists/{self.task_list.id}/',
            {'archived': False},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertTrue(task.completed)

    def test_archive_task_list(self):
        response = self.client.patch(
            f'/api/tasks/lists/{self.task_list.id}/',
            {'archived': True},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.task_list.refresh_from_db()
        self.assertTrue(self.task_list.archived)

class TaskListViewTest(TestCase):
    """Tests for task list view."""
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_get_tasks(self):
        make_task(self.user, 'Task 1')
        make_task(self.user, 'Task 2')
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_tasks_filter_by_list(self):
        tl = make_task_list(self.user)
        make_task(self.user, 'In List', task_list=tl)
        make_task(self.user, 'No List')
        response = self.client.get(f'/api/tasks/?list={tl.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'In List')

    def test_get_tasks_filter_by_module(self):
        from studyFlax.models.modules.moduleModel import Module
        module = Module.objects.create(
            module_code='TST01', module_name='Test Module',
            created_by=self.user, start_time=timezone.now(), end_time=timezone.now()
        )
        task = make_task(self.user, 'Module Task')
        task.module = module
        task.save()
        make_task(self.user, 'No Module')
        response = self.client.get(f'/api/tasks/?module={module.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Module Task')

    def test_get_tasks_filter_by_completed(self):
        make_task(self.user, 'Done', completed=True)
        make_task(self.user, 'Todo', completed=False)
        response = self.client.get('/api/tasks/?completed=true')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Done')

    def test_get_tasks_only_own(self):
        other = make_user('other2', 'other2@example.com')
        make_task(other, 'Others Task')
        make_task(self.user, 'My Task')
        response = self.client.get('/api/tasks/')
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'My Task')

    def test_create_task(self):
        response = self.client.post('/api/tasks/', {'title': 'New Task', 'priority': 'high'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Task')
        self.assertTrue(Task.objects.filter(user=self.user, title='New Task').exists())

    def test_create_task_invalid(self):
        response = self.client.post('/api/tasks/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_task_with_due_date_creates_calendar_event(self):
        due = (timezone.now() + timedelta(days=2)).isoformat()
        response = self.client.post('/api/tasks/', {
            'title': 'Task With Due Date',
            'due_date': due,
            'priority': 'medium',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        task = Task.objects.get(id=response.data['id'])
        self.assertTrue(
            CalendarEvent.objects.filter(user=self.user, source='task', external_id=str(task.id)).exists()
        )

    def test_create_task_without_due_date_no_calendar_event(self):
        response = self.client.post('/api/tasks/', {'title': 'No Due Date'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        task = Task.objects.get(id=response.data['id'])
        self.assertFalse(
            CalendarEvent.objects.filter(source='task', external_id=str(task.id)).exists()
        )

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

class LogTaskTimeViewTest(TestCase):
    """Tests for log task time view."""
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)
        self.task = make_task(self.user, 'Timed Task')

    def test_log_time(self):
        response = self.client.post(f'/api/tasks/{self.task.id}/log-time/', {'minutes': 30})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['time_spent_minutes'], 30)
        self.task.refresh_from_db()
        self.assertEqual(self.task.time_spent_minutes, 30)

    def test_log_time_accumulates(self):
        self.task.time_spent_minutes = 10
        self.task.save()
        response = self.client.post(f'/api/tasks/{self.task.id}/log-time/', {'minutes': 25})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['time_spent_minutes'], 35)

    def test_log_time_task_not_found(self):
        response = self.client.post('/api/tasks/99999/log-time/', {'minutes': 10})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_log_time_default_zero(self):
        response = self.client.post(f'/api/tasks/{self.task.id}/log-time/', {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['time_spent_minutes'], 0)

    def test_log_time_with_page_count_triggers_reading_update(self):
        task = make_task(self.user, 'Reading Task')
        task.page_count = 50
        task.save()
        response = self.client.post(f'/api/tasks/{task.id}/log-time/', {'minutes': 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

