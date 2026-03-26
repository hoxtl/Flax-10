"""
Backend tests for session model.
"""

from django.test import TestCase
from django.utils import timezone
from studyFlax.models.auth.user_model import User
from studyFlax.models.timer.session_model import StudySession


class StudySessionModelTest(TestCase):
    """Tests for study session model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='password123',
            first_name='Test', last_name='User'
        )

    def test_create_session(self):
        now = timezone.now()
        session = StudySession.objects.create(
            user=self.user,
            start_time=now,
            end_time=now,
            duration=25,
            break_duration=5,
            session_count=1,
            study_block_id=12345,
            task='Test Task'
        )
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.duration, 25)
        self.assertEqual(session.task, 'Test Task')
        self.assertEqual(session.status, 'Completed')

    def test_str_representation(self):
        now = timezone.now()
        session = StudySession.objects.create(
            user=self.user, start_time=now, end_time=now,
            duration=45, study_block_id=123
        )
        self.assertIn('test@example.com', str(session))
        self.assertIn('45m', str(session))
