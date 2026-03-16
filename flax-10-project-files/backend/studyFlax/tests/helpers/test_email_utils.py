"""
Backend tests for email utils.
"""

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()

class EmailUtilsTest(TestCase):
    """Tests for email utils."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="email_user",
            email="email_user@e.com",
            password="pass",
        )

    @patch("studyFlax.utils.email_utils.send_mail")
    @patch("studyFlax.utils.email_utils.render_to_string")
    def test_send_reset_password_email(self, mock_render, mock_send):
        from studyFlax.utils.email_utils import send_reset_password_email

        mock_render.return_value = "<html>Reset</html>"
        send_reset_password_email(
            self.user, "http://example.com/reset?token=abc"
        )

        mock_send.assert_called_once()
        call_kwargs = mock_send.call_args[1]
        self.assertIn(self.user.email, call_kwargs["recipient_list"])
        self.assertIn("reset password", call_kwargs["subject"].lower())

