"""
View for confirming a token-based password reset.
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from studyFlax.models.auth.resetPasswordTokenModel import ResetPasswordToken
from studyFlax.serialisers.auth.reset_password_serialisers import ResetPasswordConfirmSerialiser
from django.db import DatabaseError
import logging

logger = logging.getLogger(__name__)

def _do_reset(token_str, new_password):
    """Apply the password reset; raise ValueError if the token is invalid."""
    token = ResetPasswordToken.objects.get(token=token_str)
    if not token.is_token_valid():
        raise ValueError('expired')
    user = token.user
    user.set_password(new_password)
    user.save()
    token.token_used = True
    token.save()
    return user

@api_view(['POST'])
def confirm_password_reset_view(request):
    """Confirm a token-based password reset and update the user's password."""
    serialiser = ResetPasswordConfirmSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = _do_reset(serialiser.validated_data['token'], serialiser.validated_data['new_password'])
        logger.info(f"Password reset for user: {user.username}")
        return Response({'message': 'Password reset successfully!'}, status=status.HTTP_200_OK)
    except ValueError:
        return Response({'error': 'The reset link expired or has been used already...'}, status=status.HTTP_400_BAD_REQUEST)
    except ResetPasswordToken.DoesNotExist:
        return Response({'error': 'Reset link does not exist...'}, status=status.HTTP_400_BAD_REQUEST)
    except DatabaseError as exc:
        logger.error("Database issue during password reset")
        logger.debug("Error details", exc_info=exc)
        return Response({'error': 'Unable to update credentials now. Please try again shortly.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
