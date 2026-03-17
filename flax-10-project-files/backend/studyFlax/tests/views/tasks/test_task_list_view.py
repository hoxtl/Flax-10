"""
Backend tests for task list views.
"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.tests.helpers.factories import make_task_list, make_user
from studyFlax.models.tasks.taskModel import TaskList

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
