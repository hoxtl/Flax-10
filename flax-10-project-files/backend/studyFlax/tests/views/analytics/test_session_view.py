"""
Backend tests for session views.
"""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from studyFlax.models.auth.user_model import User
from studyFlax.models.timer.session_model import StudySession

class StudySessionViewTest(APITestCase):
    """Tests for study session view."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='password123',
            first_name='Test', last_name='User'
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('study-session-list')

    def test_create_session(self):
        data = {
            'start_time': '2026-02-15T12:00:00Z',
            'end_time': '2026-02-15T12:25:00Z',
            'duration': 25,
            'break_duration': 5,
            'session_count': 1,
            'study_block_id': 12345,
            'task': 'My Task'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StudySession.objects.count(), 1)
        self.assertEqual(StudySession.objects.get().user, self.user)

    def test_list_sessions(self):
        StudySession.objects.create(user=self.user, duration=25, study_block_id=1, start_time='2026-02-15T12:00:00Z', end_time='2026-02-15T12:25:00Z')
        StudySession.objects.create(user=self.user, duration=50, study_block_id=2, start_time='2026-02-15T13:00:00Z', end_time='2026-02-15T13:50:00Z')
        
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['duration'], 50)

    def test_delete_session(self):
        session = StudySession.objects.create(user=self.user, duration=25, study_block_id=1, start_time='2026-02-15T12:00:00Z', end_time='2026-02-15T12:25:00Z')
        url = reverse('study-session-detail', args=[session.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(StudySession.objects.count(), 0)

    def test_unauthenticated_access(self):
        self.client.logout()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
