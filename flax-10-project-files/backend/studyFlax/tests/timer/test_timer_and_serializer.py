"""
Backend tests for timer and serializer.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.tasks.taskModel import Task

User = get_user_model()


def make_user(username='timeruser', email='timer@example.com'):
    return User.objects.create_user(username=username, email=email, password='pass')


def make_session(user, duration=60, status_str='Completed'):
    now = timezone.now()
    return StudySession.objects.create(
        user=user,
        start_time=now - timedelta(minutes=duration),
        end_time=now,
        duration=duration,
        break_duration=0,
        pause_duration=0,
        session_count=1,
        study_block_id=1234,
        status=status_str,
    )


class StudySessionSerializerTest(TestCase):
    """Tests for timerSerializer.py (StudySessionSerializer)."""

    def setUp(self):
        self.user = make_user()

    def test_serializer_creates_session_with_user(self):
        from studyFlax.serialisers.timerSerializer import StudySessionSerializer
        from unittest.mock import MagicMock
        now = timezone.now()
        data = {
            'start_time': (now - timedelta(minutes=30)).isoformat(),
            'end_time': now.isoformat(),
            'duration': 30,
            'break_duration': 0,
            'pause_duration': 0,
            'session_count': 1,
            'study_block_id': 999,
            'status': 'Completed',
        }
        request = MagicMock()
        request.user = self.user
        serializer = StudySessionSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertEqual(instance.user, self.user)

    def test_serializer_read_only_fields(self):
        from studyFlax.serialisers.timerSerializer import StudySessionSerializer
        session = make_session(self.user)
        serializer = StudySessionSerializer(session)
        data = serializer.data
        self.assertIn('id', data)
        self.assertIn('created_at', data)
        self.assertIn('duration', data)
        self.assertIn('status', data)

    def test_serializer_all_fields_present(self):
        from studyFlax.serialisers.timerSerializer import StudySessionSerializer
        session = make_session(self.user)
        serializer = StudySessionSerializer(session)
        expected_fields = [
            'id', 'start_time', 'end_time', 'duration',
            'break_duration', 'pause_duration', 'session_count',
            'study_block_id', 'task', 'status', 'created_at'
        ]
        for field in expected_fields:
            self.assertIn(field, serializer.data)


class StudySessionViewSetTest(TestCase):
    """Tests for timerViews.py (StudySessionViewSet)."""

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_list_sessions(self):
        make_session(self.user)
        make_session(self.user)
        response = self.client.get('/api/timer/history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_sessions_only_own(self):
        other = make_user('other_timer', 'other_timer@example.com')
        make_session(other)
        make_session(self.user)
        response = self.client.get('/api/timer/history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_session(self):
        now = timezone.now()
        data = {
            'start_time': (now - timedelta(minutes=45)).isoformat(),
            'end_time': now.isoformat(),
            'duration': 45,
            'break_duration': 5,
            'pause_duration': 0,
            'session_count': 1,
            'study_block_id': 5678,
            'status': 'Completed',
        }
        response = self.client.post('/api/timer/history/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(StudySession.objects.filter(user=self.user, duration=45).exists())

    def test_create_session_with_task_increments_completed_blocks(self):
        task = Task.objects.create(
            user=self.user, title='Timed Task',
            estimated_blocks=4, completed_blocks=0
        )
        now = timezone.now()
        data = {
            'start_time': (now - timedelta(minutes=25)).isoformat(),
            'end_time': now.isoformat(),
            'duration': 25,
            'break_duration': 0,
            'pause_duration': 0,
            'session_count': 1,
            'study_block_id': 9999,
            'status': 'Completed',
            'task_id': task.id,
        }
        response = self.client.post('/api/timer/history/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        task.refresh_from_db()
        self.assertEqual(task.completed_blocks, 1)

    def test_create_session_with_invalid_task_id_no_error(self):
        now = timezone.now()
        data = {
            'start_time': (now - timedelta(minutes=25)).isoformat(),
            'end_time': now.isoformat(),
            'duration': 25,
            'break_duration': 0,
            'pause_duration': 0,
            'session_count': 1,
            'study_block_id': 8888,
            'status': 'Completed',
            'task_id': 99999,
        }
        response = self.client.post('/api/timer/history/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_retrieve_session(self):
        session = make_session(self.user)
        response = self.client.get(f'/api/timer/history/{session.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['duration'], session.duration)

    def test_delete_session(self):
        session = make_session(self.user)
        response = self.client.delete(f'/api/timer/history/{session.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(StudySession.objects.filter(id=session.id).exists())

    def test_clear_history(self):
        make_session(self.user)
        make_session(self.user)
        response = self.client.delete('/api/timer/history/clear_history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(StudySession.objects.filter(user=self.user).count(), 0)
        self.assertIn('deleted', response.data['message'])

    def test_clear_history_only_deletes_own(self):
        other = make_user('other_clear', 'other_clear@example.com')
        make_session(other)
        make_session(self.user)
        response = self.client.delete('/api/timer/history/clear_history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(StudySession.objects.filter(user=other).count(), 1)

    def test_unauthenticated_access(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/timer/history/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_session(self):
        session = make_session(self.user)
        response = self.client.patch(f'/api/timer/history/{session.id}/', {'status': 'Overtime'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        session.refresh_from_db()
        self.assertEqual(session.status, 'Overtime')
