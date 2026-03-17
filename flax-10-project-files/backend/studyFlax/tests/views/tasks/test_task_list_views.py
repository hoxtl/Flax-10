"""
Tests for task view branches not covered in test_task_views.py.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.tasks.taskModel import Task, TaskList

User = get_user_model()

class TaskViewCoverageTest(TestCase):
    """Tests for task_views branches not yet covered."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='tv_user', email='tv_user@test.com', password='pass'
        )
        self.client.force_authenticate(user=self.user)

    def test_unarchive_list_marks_tasks_complete(self):
        task_list = TaskList.objects.create(user=self.user, name='Archived', archived=True)
        Task.objects.create(user=self.user, title='Todo', task_list=task_list)
        response = self.client.patch(
            f'/api/tasks/lists/{task_list.id}/', {'archived': False}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_invalid_task_update_returns_400(self):
        task = Task.objects.create(user=self.user, title='Task')
        response = self.client.patch(f'/api/tasks/{task.id}/', {'priority': 'impossible'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
