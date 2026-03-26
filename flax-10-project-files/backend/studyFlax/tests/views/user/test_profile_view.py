"""
Backend tests for profile view endpoints.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.modules.enrollment_model import Enrollment
from studyFlax.models.modules.module_model import Module
from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.models.timer.session_model import StudySession
from studyFlax.models.notifications.notification_model import Notification

User = get_user_model()


class ProfileViewTest(TestCase):
    """Tests for /api/profile/ and /api/users/<id>/profile/."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='pass',
            first_name='Test', last_name='User'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('username', response.data)

    def test_get_profile_with_events(self):
        CalendarEvent.objects.create(
            user=self.user,
            title='Test',
            start_time=timezone.now() + timezone.timedelta(hours=1),
            end_time=timezone.now() + timezone.timedelta(hours=2),
        )
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('event_count', response.data)

    def test_get_profile_includes_last_session_end(self):
        StudySession.objects.create(
            user=self.user,
            start_time=timezone.now() - timezone.timedelta(hours=2),
            end_time=timezone.now() - timezone.timedelta(hours=1),
            duration=60,
            break_duration=0,
            pause_duration=0,
            status='Completed',
            study_block_id=12345,
            session_count=1,
        )
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('last_session_end', response.data)
        self.assertIsNotNone(response.data['last_session_end'])

    def test_get_profile_includes_completion_metadata(self):
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile_completion', response.data)
        completion = response.data['profile_completion']
        self.assertEqual(completion['total'], 5)
        self.assertIn('next_action', completion)
        self.assertEqual(len(completion['checkpoints']), 5)

    def test_patch_profile_username(self):
        response = self.client.patch('/api/profile/', {'username': 'newusername'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_same_username(self):
        response = self.client.patch('/api/profile/', {'username': 'testuser'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_taken_username(self):
        User.objects.create_user(username='taken', email='taken@example.com', password='pass')
        response = self.client.patch('/api/profile/', {'username': 'taken'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_profile_bio(self):
        response = self.client.patch('/api/profile/', {'bio': 'Hello world'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_weekly_goal(self):
        response = self.client.patch('/api/profile/', {'weekly_goal_hours': '10'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_pinned_badge_id(self):
        response = self.client.patch('/api/profile/', {'pinned_badge_id': 'goal_getter'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.pinned_badge_id, 'goal_getter')

    def test_patch_profile_remove_photo(self):
        response = self.client.patch('/api/profile/', {'remove_photo': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_upload_photo(self):
        response = self.client.patch(
            '/api/profile/',
            {'profile_photo': SimpleUploadedFile('photo.png', b'abc', content_type='image/png')},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_another_user_profile(self):
        other = User.objects.create_user(
            username='other', email='other@example.com', password='pass'
        )
        response = self.client.get(f'/api/users/{other.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_another_user_profile_not_found(self):
        response = self.client.get('/api/users/99999/profile/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_suggest_study_session_creates_notification(self):
        target = User.objects.create_user(
            username='study_pal', email='study_pal@example.com', password='pass'
        )
        response = self.client.post('/api/profile/study-together/', {'target_user_id': target.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        notification = Notification.objects.get(user=target)
        self.assertEqual(notification.notification_type, 'meeting_suggestion')
        self.assertIn(self.user.username, notification.title)

    def test_suggest_study_session_rejects_self_target(self):
        response = self.client.post('/api/profile/study-together/', {'target_user_id': self.user.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_profile_returns_only_taught_modules(self):
        teacher = self._make_teacher('teacher1', 'teacher1@example.com', 'Teach', 'Er')
        other_teacher = self._make_teacher('teacher2', 'teacher2@example.com', 'Other', 'Teach')
        taught = self._make_module('CS9001', 'Teaching Module', teacher)
        self._make_module('CS9002', 'Not Mine', other_teacher)
        Enrollment.objects.create(student=teacher, module=taught)
        response = self.client.get(f'/api/users/{teacher.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['modules'], ['CS9001'])
        self.assertEqual(response.data['module_count'], 1)

    def test_profile_prefers_taught_modules_when_role_is_stale(self):
        creator = User.objects.create_user(
            username='creator1', email='creator1@example.com',
            password='pass', first_name='Create', last_name='Or', role='student',
        )
        self._make_module('CS9010', 'Creator Module', creator)
        response = self.client.get(f'/api/users/{creator.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['modules'], ['CS9010'])
        self.assertEqual(response.data['module_count'], 1)

    def test_unauthenticated(self):
        response = APIClient().get('/api/profile/')
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def _make_teacher(self, username, email, first_name, last_name):
        return User.objects.create_user(
            username=username, email=email, password='pass',
            first_name=first_name, last_name=last_name, role='teacher',
        )

    def _make_module(self, code, name, created_by):
        return Module.objects.create(
            module_code=code, module_name=name, created_by=created_by,
            start_time=timezone.now(), end_time=timezone.now() + timezone.timedelta(hours=2),
        )


class ProfileViewHelpersTest(TestCase):
    """Direct helper coverage for profile updates."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='owner', email='owner@example.com', password='pass'
        )

    def test_update_username_rejects_taken_name(self):
        User.objects.create_user(username='claimed', email='claimed@example.com', password='pass')
        from studyFlax.views.user.profile_helpers import update_username

        response = update_username(self.user, {'username': 'claimed'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileViewCoverageTest(TestCase):
    """Tests for the profile photo branch."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='pv_user', email='pv_user@test.com', password='pass',
            first_name='PV', last_name='User'
        )
        self.client.force_authenticate(user=self.user)

    def test_patch_remove_photo(self):
        response = self.client.patch('/api/profile/', data={'remove_photo': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class SuggestStudySessionViewTest(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.sender = User.objects.create_user(
            username='sender', email='sender@test.com', password='pass'
        )
        self.receiver = User.objects.create_user(
            username='receiver', email='receiver@test.com', password='pass'
        )
        self.client.force_authenticate(user=self.sender)

    def test_missing_target_user_id_returns_400(self):
        response = self.client.post('/api/profile/study-together/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('target_user_id', response.data['error'])

    def test_nonexistent_target_user_returns_404(self):
        response = self.client.post('/api/profile/study-together/', {'target_user_id': 99999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_success_with_custom_message(self):
        response = self.client.post('/api/profile/study-together/', {
            'target_user_id': self.receiver.id,
            'message': 'Let us study together!',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Notification.objects.filter(user=self.receiver).exists())
        notification = Notification.objects.get(user=self.receiver)
        self.assertEqual(notification.message, 'Let us study together!')

    def test_success_with_slot_times(self):
        response = self.client.post('/api/profile/study-together/', {
            'target_user_id': self.receiver.id,
            'slot_start': '2026-03-24 10:00',
            'slot_end': '2026-03-24 12:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        notification = Notification.objects.get(user=self.receiver)
        self.assertIn('suggested a study session from', notification.message)

    def test_invalid_target_user_id_type_returns_404(self):
        from studyFlax.views.user.study_session_suggestions import get_target_user
        result = get_target_user('not-a-number')
        self.assertIsNone(result)
