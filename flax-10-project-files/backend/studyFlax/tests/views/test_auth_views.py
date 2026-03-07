from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from unittest.mock import patch
from studyFlax.models.auth.resetPasswordTokenModel import ResetPasswordToken

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
    def test_logout_no_token_returns_500(self):
        user2 = User.objects.create_user(username='notoken', email='notoken@example.com', password='pass')
        client2 = APIClient()
        client2.force_authenticate(user=user2)
        response = client2.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterViewTest(TestCase):
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
        response = self.client.post(self.url, {'email': 'noone@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    def test_reset_password_invalid_data(self):
        response = self.client.post(self.url, {'email': 'not-an-email'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    @patch('studyFlax.views.authentication.password_reset_request_view.send_reset_password_email')
    def test_reset_password_email_error(self, mock_email):
        mock_email.side_effect = Exception('SMTP error')
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
        response = self.client.post(self.url, {'token': str(token.token), 'new_password': 'newpass123', 'confirm_password': 'newpass123'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
