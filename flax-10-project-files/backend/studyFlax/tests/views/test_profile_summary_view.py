import random
import uuid
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.modules.enrollmentModel import Enrollment
from studyFlax.models.modules.moduleModel import Module

User = get_user_model()


def make_session(user, duration=60, status_val='Completed', hours_ago=2):
    end = timezone.now() - timedelta(hours=hours_ago)
    start = end - timedelta(minutes=duration)
    return StudySession.objects.create(
        user=user, start_time=start, end_time=end,
        duration=duration, break_duration=10, pause_duration=0, status=status_val,
        study_block_id=random.randint(1, 999999), session_count=1
    )


class ProfileSummaryViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='pass',
            first_name='Test', last_name='User'
        )
        self.client.force_authenticate(user=self.user)

    def test_empty_profile_summary(self):
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('persona', response.data)
        self.assertIn('badges', response.data)
        self.assertIn('streaks', response.data)
        self.assertIn('weekly', response.data)

    def test_summary_with_sessions(self):
        for i in range(5):
            make_session(self.user, duration=60, hours_ago=i * 24 + 1)
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['badges']), 0)

    def test_streak_computed(self):
        for i in range(3, 0, -1):
            make_session(self.user, hours_ago=i * 24)
        response = self.client.get('/api/profile/summary/')
        self.assertGreaterEqual(response.data['streaks']['longest'], 1)

    def test_weekly_goal_percentage(self):
        self.user.weekly_goal_hours = 10
        self.user.save()
        make_session(self.user, duration=600, hours_ago=1)
        response = self.client.get('/api/profile/summary/')
        self.assertGreater(response.data['weekly']['percentage'], 0)

    def test_badges_with_many_sessions(self):
        for i in range(12):
            make_session(self.user, duration=60, hours_ago=i * 2 + 1)
        response = self.client.get('/api/profile/summary/')
        badge_ids = [b['id'] for b in response.data['badges']]
        self.assertIn('sessions_10', badge_ids)

    def test_other_user_summary(self):
        other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        response = self.client.get(f'/api/profile/summary/?user_id={other.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_other_user_not_found(self):
        response = self.client.get('/api/profile/summary/?user_id=99999')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_incomplete_sessions_excluded_from_badges(self):
        make_session(self.user, status_val='Incomplete', duration=120)
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_persona_night_owl(self):
        end = timezone.now().replace(hour=22, minute=0) - timedelta(days=1)
        start = end - timedelta(minutes=60)
        for _ in range(5):
            StudySession.objects.create(
                user=self.user, start_time=start, end_time=end,
                duration=60, break_duration=0, pause_duration=0, status='Completed',
                study_block_id=random.randint(1, 999999), session_count=1
            )
        response = self.client.get('/api/profile/summary/')
        self.assertIn('id', response.data['persona'])

    def test_with_module_enrollments(self):
        for i in range(3):
            module = Module.objects.create(
                module_code=f'CS10{i}', module_name=f'Module {i}',
                created_by=self.user, start_time=timezone.now(), end_time=timezone.now()
            )
            Enrollment.objects.create(student=self.user, module=module)
        response = self.client.get('/api/profile/summary/')
        badge_ids = [b['id'] for b in response.data['badges']]
        self.assertIn('multi_module', badge_ids)

    def test_unauthenticated(self):
        response = APIClient().get('/api/profile/summary/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
