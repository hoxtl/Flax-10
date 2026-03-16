"""
View for requesting a password reset email.
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from studyFlax.models import User
from studyFlax.models.auth.resetPasswordTokenModel import ResetPasswordToken
from studyFlax.serialisers.auth.reset_password_serialisers import ResetPasswordSerialiser
from studyFlax.utils.email_utils import send_reset_password_email
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def _send_reset_email(user_email):
    """Invalidate existing tokens and dispatch a new password reset email."""
    user = User.objects.get(email__iexact=user_email)
    ResetPasswordToken.objects.filter(user=user, token_used=False).update(token_used=True)
    new_token = ResetPasswordToken.create_user_token(user)
    reset_link = f"{settings.FRONTEND_URL}/reset-password/{new_token.token}"
    send_reset_password_email(user=user, reset_link=reset_link)

@api_view(['POST'])
def reset_password_view(request):
    """Send a password reset email if an account with the given address exists."""
    serialiser = ResetPasswordSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    try:
        _send_reset_email(serialiser.validated_data['email'])
        logger.info("Password reset link sent successfully")
    except User.DoesNotExist:
        logger.warning("No user with such email found")
    except Exception as e:
        logger.error(f"Error during password reset request: {str(e)}")
        return Response({'error': "Error when sending reset password email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({'message': "Reset password email sent."}, status=status.HTTP_200_OK)
