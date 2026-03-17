"""
Backend tests for task collection endpoints.
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.models.tasks.task_model import Task
from studyFlax.tests.helpers.factories import make_task, make_task_list, make_user


class TaskListViewTest(TestCase):
    """Tests for task collection view."""

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
        from studyFlax.models.modules.module_model import Module
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
