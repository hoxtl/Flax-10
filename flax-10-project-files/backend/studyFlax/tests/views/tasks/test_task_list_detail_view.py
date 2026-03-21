"""
Backend tests for task list detail view.
"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.tasks.task_model import TaskList
from studyFlax.tests.helpers.factories import make_task, make_task_list, make_user


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
