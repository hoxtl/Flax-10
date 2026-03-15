"""
Tests for authentication views including login, logout, registration, and password reset flows.
"""

from datetime import timedelta

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient, APIRequestFactory
from unittest.mock import patch

from studyFlax.models.auth.resetPasswordTokenModel import ResetPasswordToken
from studyFlax.models.auth.userSettingsModel import UserSettings
from studyFlax.models.society.societyModel import Society
from studyFlax.models.tasks.taskModel import Task

User = get_user_model()

class LoginViewTest(TestCase):
    """Tests for the login endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        self.url = '/api/auth/login/'
    def test_login_success(self):
        response = self.client.post(self.url, {'username': 'testuser', 'password': 'testpass123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
    def test_login_invalid_credentials(self):
        response = self.client.post(self.url, {'username': 'testuser', 'password': 'wrongpass'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    def test_login_invalid_data(self):
        response = self.client.post(self.url, {'username': '', 'password': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    def test_login_existing_token_reused(self):
        Token.objects.create(user=self.user)
        response = self.client.post(self.url, {'username': 'testuser', 'password': 'testpass123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class LogoutViewTest(TestCase):
    """Tests for the logout endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        Token.objects.create(user=self.user)
        self.client.force_authenticate(user=self.user)
        self.url = '/api/auth/logout/'
    def test_logout_success(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    def test_logout_unauthenticated(self):
        response = APIClient().post(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    def test_logout_no_token_returns_500(self):
        user2 = User.objects.create_user(username='notoken', email='notoken@example.com', password='pass')
        client2 = APIClient()
        client2.force_authenticate(user=user2)
        response = client2.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterViewTest(TestCase):
    """Tests for the registration endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/register/'
        self.valid_data = {'username': 'newuser', 'password': 'newpass123', 'password2': 'newpass123', 'email': 'new@example.com', 'first_name': 'New', 'last_name': 'User'}
    def test_register_success(self):
        response = self.client.post(self.url, self.valid_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
    def test_register_invalid_data(self):
        response = self.client.post(self.url, {'username': '', 'password': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    def test_register_duplicate_username(self):
        User.objects.create_user(username='newuser', email='other@example.com', password='pass')
        response = self.client.post(self.url, self.valid_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestViewTest(TestCase):
    """Tests for the password reset request endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        self.url = '/api/auth/password-reset/request/'
    @patch('studyFlax.views.authentication.password_reset_request_view.send_reset_password_email')
    def test_reset_password_success(self, mock_email):
        response = self.client.post(self.url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_email.assert_called_once()
    def test_reset_password_nonexistent_email(self):
        with self.assertLogs('studyFlax.views.authentication.password_reset_request_view', level='WARNING'):
            response = self.client.post(self.url, {'email': 'noone@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    def test_reset_password_invalid_data(self):
        response = self.client.post(self.url, {'email': 'not-an-email'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    @patch('studyFlax.views.authentication.password_reset_request_view.send_reset_password_email')
    def test_reset_password_email_error(self, mock_email):
        mock_email.side_effect = Exception('SMTP error')
        with self.assertLogs('studyFlax.views.authentication.password_reset_request_view', level='ERROR'):
            response = self.client.post(self.url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    @patch('studyFlax.views.authentication.password_reset_request_view.send_reset_password_email')
    def test_reset_invalidates_old_tokens(self, mock_email):
        ResetPasswordToken.create_user_token(self.user)
        response = self.client.post(self.url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(ResetPasswordToken.objects.filter(user=self.user, token_used=True).count(), 0)

class ConfirmPasswordResetViewTest(TestCase):
    """Tests for the password reset confirmation endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        self.url = '/api/auth/password-reset/confirm/'
    def test_confirm_reset_success(self):
        token = ResetPasswordToken.create_user_token(self.user)
        response = self.client.post(self.url, {'token': str(token.token), 'new_password': 'newpass123', 'confirm_password': 'newpass123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    def test_confirm_reset_invalid_token(self):
        response = self.client.post(self.url, {'token': 'nonexistent-token', 'new_password': 'newpass123'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_reset_token_does_not_exist(self):
        response = self.client.post(self.url, {
            'token': 'does-not-exist-in-db',
            'new_password': 'newpass123',
            'confirm_password': 'newpass123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Reset link does not exist', response.data['error'])
    def test_confirm_reset_invalid_data(self):
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    def test_confirm_reset_used_token(self):
        token = ResetPasswordToken.create_user_token(self.user)
        token.token_used = True
        token.save()
        response = self.client.post(self.url, {'token': str(token.token), 'new_password': 'newpass123', 'confirm_password': 'newpass123'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    @patch('studyFlax.views.authentication.confirm_password_reset_view.ResetPasswordToken.objects.get')
    def test_confirm_reset_unexpected_error(self, mock_get):
        mock_get.side_effect = Exception('DB error')
        token = ResetPasswordToken.create_user_token(self.user)
        with self.assertLogs('studyFlax.views.authentication.confirm_password_reset_view', level='ERROR'):
            response = self.client.post(self.url, {'token': str(token.token), 'new_password': 'newpass123', 'confirm_password': 'newpass123'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetPasswordSerializerTest(TestCase):
    """Tests for reset password serializer."""
    def test_normalise_email(self):
        from studyFlax.serialisers.reset_password_serialisers import ResetPasswordSerialiser
        serializer = ResetPasswordSerialiser()
        self.assertEqual(
            serializer.normalise_lowercase_email('  TEST@Example.COM  '),
            'test@example.com',
        )

    def test_confirm_passwords_match(self):
        from studyFlax.serialisers.reset_password_serialisers import ResetPasswordConfirmSerialiser
        serializer = ResetPasswordConfirmSerialiser()
        data = {'new_password': 'abc12345', 'confirm_password': 'abc12345', 'token': 'tok'}
        self.assertEqual(serializer.validate_passwords(data), data)

    def test_confirm_passwords_mismatch(self):
        from rest_framework.exceptions import ValidationError
        from studyFlax.serialisers.reset_password_serialisers import ResetPasswordConfirmSerialiser

        serializer = ResetPasswordConfirmSerialiser()
        data = {'new_password': 'abc12345', 'confirm_password': 'different', 'token': 'tok'}
        with self.assertRaises(ValidationError):
            serializer.validate_passwords(data)


class RegistrationSerializerEmailTest(TestCase):
    """Tests for RegistrationUserSerialiser duplicate email validation."""

    def setUp(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.create_user(
            username='existing', email='existing@test.com', password='pass',
            first_name='Ex', last_name='User'
        )

    def test_duplicate_email_rejected(self):
        from studyFlax.serialisers.auth_serialisers import RegistrationUserSerialiser
        data = {
            'username': 'newuser',
            'email': 'existing@test.com',
            'password': 'password123',
            'password2': 'password123',
            'first_name': 'New',
            'last_name': 'User',
        }
        serializer = RegistrationUserSerialiser(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)


class AuthAndTaskCoverageTest(TestCase):
    """Tests for auth serializer and task helper branches."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(username='auth_cov', email='auth_cov@example.com', password='pass')

    def test_user_serializer_without_request_returns_false_and_none_values(self):
        from studyFlax.serialisers.auth_serialisers import UserSerialiser
        serializer = UserSerialiser(self.user)
        self.assertFalse(serializer.data['is_shared_with_me'])
        self.assertFalse(serializer.data['is_sharing'])
        self.assertIsNone(serializer.data['study_hours_this_week'])
        self.assertIsNone(serializer.data['study_streak'])

    def test_user_serializer_with_settings_modules(self):
        from studyFlax.serialisers.auth_serialisers import UserSerialiser
        UserSettings.objects.create(user=self.user, modules=['CS200'])
        request = self.factory.get('/')
        request.user = self.user
        serializer = UserSerialiser(self.user, context={'request': request})
        self.assertEqual(serializer.data['modules'], ['CS200'])

    def test_get_user_tasks_list_filter_helper(self):
        from studyFlax.views.tasks.task_views import get_user_tasks
        task_list = self.user.task_lists.create(name='Personal', category='personal')
        Task.objects.create(user=self.user, title='Listed', task_list=task_list)
        Task.objects.create(user=self.user, title='Other')
        tasks = get_user_tasks(self.user, {'list': str(task_list.id)})
        self.assertEqual(tasks.count(), 1)


class SerializerCoverageTest(TestCase):
    """Tests for serializer branches not yet covered."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='ser_user', email='ser_user@test.com', password='pass'
        )

    def test_registration_serializer_duplicate_username(self):
        from studyFlax.serialisers.auth_serialisers import RegistrationUserSerialiser
        data = {
            'username': 'ser_user',
            'email': 'new@test.com',
            'password': 'password1',
            'password2': 'password1',
            'first_name': 'Test',
            'last_name': 'User',
        }
        serializer = RegistrationUserSerialiser(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_user_serializer_is_sharing_self(self):
        from studyFlax.serialisers.auth_serialisers import UserSerialiser
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = self.user
        serializer = UserSerialiser(self.user, context={'request': request})
        self.assertTrue(serializer.data['is_sharing'])

    def test_deadline_serializer_non_teacher_validation(self):
        from studyFlax.serialisers.deadline_serialisers import DeadlineSerialiser
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = self.user
        data = {'title': 'Test', 'deadline_type': 'coursework', 'start_due_date': timezone.now().isoformat()}
        serializer = DeadlineSerialiser(data=data, context={'request': request})
        self.assertFalse(serializer.is_valid())

    def test_user_settings_serializer_valid_major_update(self):
        from studyFlax.serialisers.user_settings_serialisers import UserSettingsSerialiser
        settings = UserSettings.objects.create(user=self.user, theme='light', timezone='Europe/London')
        serializer = UserSettingsSerialiser(settings, data={'major': 'Physics'}, partial=True)
        self.assertTrue(serializer.is_valid())

    def test_registration_serializer_passwords_mismatch(self):
        from studyFlax.serialisers.auth_serialisers import RegistrationUserSerialiser
        data = {
            'username': 'mismatch_user',
            'email': 'mismatch@test.com',
            'password': 'password1',
            'password2': 'password2',
            'first_name': 'Test',
            'last_name': 'User',
        }
        serializer = RegistrationUserSerialiser(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_society_event_serialiser_announcement_prefix(self):
        from studyFlax.serialisers.society_serialisers import SocietyEventSerialiser
        from studyFlax.models.society.societyAnnouncementModel import SocietyAnnouncement
        from studyFlax.models.society.societyEventModel import SocietyEvent
        society = Society.objects.create(name='PrefixSoc', bio='bio', admin_emails='a@b.com')
        ann = SocietyAnnouncement.objects.create(society=society, title='Announcement', content='Body')
        event = SocietyEvent.objects.create(
            society=society, title='Launch',
            start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1),
            recurrence='none', announcement=ann,
        )
        serializer = SocietyEventSerialiser(event)
        self.assertIn('📢', serializer.data['title'])
