"""
View for requesting a password reset email.
"""

import smtplib
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from django.template import TemplateDoesNotExist, TemplateSyntaxError
from django.core.mail import BadHeaderError
from studyFlax.models import User
from studyFlax.models.authentication.reset_password_token_model import ResetPasswordToken
from studyFlax.serialisers.authentication.reset_password_serialisers import ResetPasswordSerialiser
from studyFlax.utils.email_utils import send_reset_password_email
from django.conf import settings
import logging


logger = logging.getLogger(__name__)
EMAIL_SEND_ERRORS = (
    BadHeaderError, TemplateDoesNotExist, TemplateSyntaxError, smtplib.SMTPException,
    ConnectionError, TimeoutError, ValueError,
)

def _send_reset_email(user_email):
    """Invalidate existing tokens and dispatch a new password reset email."""
    user = User.objects.get(email__iexact=user_email)
    ResetPasswordToken.objects.filter(user=user, token_used=False).update(token_used=True)
    new_token = ResetPasswordToken.create_user_token(user)
    reset_link = f"{settings.FRONTEND_URL}/reset-password/{new_token.token}"
    send_reset_password_email(user=user, reset_link=reset_link)

def _validated_reset_serialiser(request):
    serialiser = ResetPasswordSerialiser(data=request.data)
    if serialiser.is_valid():
        return serialiser, None
    return None, Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

def _validation_error_response(exc):
    logger.warning("Password reset validation failed for email")
    return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

def _email_error_response(exc):
    logger.error("Error during password reset request")
    logger.debug("Error details", exc_info=exc)
    return Response({'error': "Error when sending reset password email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _dispatch_reset_email(serialiser):
    _send_reset_email(serialiser.validated_data['email'])
    logger.info("Password reset link sent successfully")

def _handle_missing_user():
    logger.warning("No user with such email found")

def _reset_password_result(serialiser):
    try:
        _dispatch_reset_email(serialiser)
    except ValidationError as exc:
        return _validation_error_response(exc)
    except User.DoesNotExist:
        _handle_missing_user()
    except EMAIL_SEND_ERRORS as exc:
        return _email_error_response(exc)
    except Exception as exc:
        return _email_error_response(exc)
    return Response({'message': "Reset password email sent."}, status=status.HTTP_200_OK)

@api_view(['POST'])
def reset_password_view(request):
    """Send a password reset email if an account with the given address exists."""
    serialiser, error_response = _validated_reset_serialiser(request)
    if error_response:
        return error_response
    return _reset_password_result(serialiser)
