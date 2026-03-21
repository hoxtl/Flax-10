"""
Backend tests for task time logging.
"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

<<<<<<< HEAD
from studyFlax.tests.helpers.test_model_builders import make_task, make_user
=======
from studyFlax.tests.helpers.factories import make_task, make_user
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)


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
