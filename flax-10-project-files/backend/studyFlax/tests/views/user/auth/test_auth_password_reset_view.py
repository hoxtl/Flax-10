"""
Tests for password reset endpoint flows.
"""

from django.core.exceptions import ValidationError
from django.db import DatabaseError
from django.test import TestCase
from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.auth.reset_password_token_model import ResetPasswordToken

from django.contrib.auth import get_user_model


User = get_user_model()


class PasswordResetRequestViewTest(TestCase):
    """Tests password reset request view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='testpass123')
        self.url = '/api/auth/password-reset/request/'

    @patch('studyFlax.views.auth.password_reset_request_view.send_reset_password_email')
    def test_reset_password_success(self, mock_email):
        response = self.client.post(self.url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_email.assert_called_once()

    def test_reset_password_nonexistent_email(self):
        with self.assertLogs('studyFlax.views.auth.password_reset_request_view', level='WARNING'):
            response = self.client.post(self.url, {'email': 'noone@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reset_password_invalid_data(self):
        response = self.client.post(self.url, {'email': 'not-an-email'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('studyFlax.views.auth.password_reset_request_view.send_reset_password_email')
    def test_reset_password_email_error(self, mock_email):
        mock_email.side_effect = Exception('SMTP error')
        with self.assertLogs('studyFlax.views.auth.password_reset_request_view', level='ERROR'):
            response = self.client.post(self.url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    @patch('studyFlax.views.auth.password_reset_request_view.send_reset_password_email')
    def test_reset_invalidates_old_tokens(self, mock_email):
        ResetPasswordToken.create_user_token(self.user)
        response = self.client.post(self.url, {'email': 'test@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(ResetPasswordToken.objects.filter(user=self.user, token_used=True).count(), 0)


class ConfirmPasswordResetViewTest(TestCase):
    """Tests confirm password reset view."""
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

    @patch('studyFlax.views.auth.confirm_password_reset_view.ResetPasswordToken.objects.get')
    def test_confirm_reset_unexpected_error(self, mock_get):
        mock_get.side_effect = Exception('DB error')
        token = ResetPasswordToken.create_user_token(self.user)
        with self.assertLogs('studyFlax.views.auth.confirm_password_reset_view', level='ERROR'):
            response = self.client.post(self.url, {'token': str(token.token), 'new_password': 'newpass123', 'confirm_password': 'newpass123'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class ConfirmPasswordResetDatabaseErrorTest(TestCase):
    """Tests confirm password reset database error."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='dberr', email='dberr@example.com', password='testpass123')
        self.url = '/api/auth/password-reset/confirm/'

    @patch('studyFlax.views.auth.confirm_password_reset_view._do_reset')
    def test_database_error_returns_503(self, mock_reset):
        mock_reset.side_effect = DatabaseError('connection lost')
        token = ResetPasswordToken.create_user_token(self.user)
        with self.assertLogs('studyFlax.views.auth.confirm_password_reset_view', level='ERROR'):
            response = self.client.post(self.url, {
                'token': str(token.token),
                'new_password': 'newpass123',
                'confirm_password': 'newpass123',
            })
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


class PasswordResetValidationErrorTest(TestCase):
    """Tests password reset validation error."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='valerr', email='valerr@example.com', password='testpass123')
        self.url = '/api/auth/password-reset/request/'

    @patch('studyFlax.views.auth.password_reset_request_view._send_reset_email')
    def test_validation_error_returns_400(self, mock_send):
        mock_send.side_effect = ValidationError('Invalid email format')
        with self.assertLogs('studyFlax.views.auth.password_reset_request_view', level='WARNING'):
            response = self.client.post(self.url, {'email': 'valerr@example.com'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nonexistent_email_still_returns_200(self):
        with self.assertLogs('studyFlax.views.auth.password_reset_request_view', level='WARNING'):
            response = self.client.post(self.url, {'email': 'nobody@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch('studyFlax.views.auth.password_reset_request_view._send_reset_email')
    def test_generic_exception_returns_500(self, mock_send):
        mock_send.side_effect = Exception('unexpected crash')
        with self.assertLogs('studyFlax.views.auth.password_reset_request_view', level='ERROR'):
            response = self.client.post(self.url, {'email': 'valerr@example.com'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    @patch('studyFlax.views.auth.password_reset_request_view._send_reset_email')
    def test_smtp_error_returns_500(self, mock_send):
        import smtplib
        mock_send.side_effect = smtplib.SMTPException('connection refused')
        with self.assertLogs('studyFlax.views.auth.password_reset_request_view', level='ERROR'):
            response = self.client.post(self.url, {'email': 'valerr@example.com'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
