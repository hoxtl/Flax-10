"""
Tests for authentication endpoint views: login, logout, register, password reset, home address.
"""

from django.core.exceptions import ValidationError
from django.db import DatabaseError
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient
from unittest.mock import patch

from studyFlax.models.auth.resetPasswordTokenModel import ResetPasswordToken
from studyFlax.models.auth.userSettingsModel import UserSettings

User = get_user_model()


class LoginViewTest(TestCase):
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

    def test_logout_no_token_returns_200(self):
        user2 = User.objects.create_user(username='notoken', email='notoken@example.com', password='pass')
        client2 = APIClient()
        client2.force_authenticate(user=user2)
        response = client2.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class RegisterViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/register/'
        self.valid_data = {
            'username': 'newuser', 'password': 'newpass123', 'password2': 'newpass123',
            'email': 'new@example.com', 'first_name': 'New', 'last_name': 'User',
        }

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


class LoginNonExistentUserTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/login/'

    def test_login_nonexistent_username_returns_401(self):
        response = self.client.post(self.url, {'username': 'doesnotexist', 'password': 'somepass123'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ConfirmPasswordResetDatabaseErrorTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='dberr', email='dberr@example.com', password='testpass123')
        self.url = '/api/auth/password-reset/confirm/'

    @patch('studyFlax.views.authentication.confirm_password_reset_view._do_reset')
    def test_database_error_returns_503(self, mock_reset):
        mock_reset.side_effect = DatabaseError('connection lost')
        token = ResetPasswordToken.create_user_token(self.user)
        with self.assertLogs('studyFlax.views.authentication.confirm_password_reset_view', level='ERROR'):
            response = self.client.post(self.url, {
                'token': str(token.token),
                'new_password': 'newpass123',
                'confirm_password': 'newpass123',
            })
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


class PasswordResetValidationErrorTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='valerr', email='valerr@example.com', password='testpass123')
        self.url = '/api/auth/password-reset/request/'

    @patch('studyFlax.views.authentication.password_reset_request_view._send_reset_email')
    def test_validation_error_returns_400(self, mock_send):
        mock_send.side_effect = ValidationError('Invalid email format')
        with self.assertLogs('studyFlax.views.authentication.password_reset_request_view', level='WARNING'):
            response = self.client.post(self.url, {'email': 'valerr@example.com'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nonexistent_email_still_returns_200(self):
        with self.assertLogs('studyFlax.views.authentication.password_reset_request_view', level='WARNING'):
            response = self.client.post(self.url, {'email': 'nobody@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('studyFlax.views.authentication.password_reset_request_view._send_reset_email')
    def test_generic_exception_returns_500(self, mock_send):
        mock_send.side_effect = Exception('unexpected crash')
        with self.assertLogs('studyFlax.views.authentication.password_reset_request_view', level='ERROR'):
            response = self.client.post(self.url, {'email': 'valerr@example.com'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    @patch('studyFlax.views.authentication.password_reset_request_view._send_reset_email')
    def test_smtp_error_returns_500(self, mock_send):
        import smtplib
        mock_send.side_effect = smtplib.SMTPException('connection refused')
        with self.assertLogs('studyFlax.views.authentication.password_reset_request_view', level='ERROR'):
            response = self.client.post(self.url, {'email': 'valerr@example.com'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterViewCoverageTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/register/'

    def test_register_returns_token_and_user(self):
        data = {
            'username': 'regcov', 'email': 'regcov@example.com',
            'password': 'securepass1', 'password2': 'securepass1',
            'first_name': 'Reg', 'last_name': 'Cov',
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertIn('user', response.data)

    def test_register_creates_user_settings(self):
        data = {
            'username': 'regset', 'email': 'regset@example.com',
            'password': 'securepass1', 'password2': 'securepass1',
            'first_name': 'Reg', 'last_name': 'Set',
        }
        self.client.post(self.url, data)
        user = User.objects.get(username='regset')
        self.assertTrue(UserSettings.objects.filter(user=user).exists())

    def test_register_invalid_data_returns_400(self):
        response = self.client.post(self.url, {'username': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutViewCoverageTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/auth/logout/'

    def test_logout_deletes_token(self):
        user = User.objects.create_user(username='logcov', email='logcov@example.com', password='pass')
        Token.objects.create(user=user)
        self.client.force_authenticate(user=user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(user=user).exists())

    def test_logout_no_token_still_200(self):
        user = User.objects.create_user(username='lognotok', email='lognotok@example.com', password='pass')
        self.client.force_authenticate(user=user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class HomeAddressViewCoverageTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='hacov', email='hacov@example.com', password='pass')
        self.client.force_authenticate(user=self.user)
        self.url = '/api/user/home-address/'

    def test_invalid_coordinates_returns_400(self):
        response = self.client.post(self.url, {
            'home_address': '123 Main St',
            'home_latitude': 'not_a_number',
            'home_longitude': '1.0',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_save_returns_200(self):
        response = self.client.post(self.url, {
            'home_address': '123 Main St',
            'home_latitude': '51.5',
            'home_longitude': '-0.1',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
