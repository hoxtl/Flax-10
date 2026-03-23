"""
View for confirming a token-based password reset.
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from studyFlax.models.auth.reset_password_token_model import ResetPasswordToken
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

def _handle_reset_error(exc):
    if isinstance(exc, DatabaseError):
        logger.error("Database issue during password reset")
        logger.debug("Error details", exc_info=exc)
        return Response({'error': 'Unable to update credentials now. Please try again shortly.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    logger.error("Unexpected error during password reset")
    logger.debug("Error details", exc_info=exc)
    return Response({'error': 'An unexpected error occurred. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _invalid_token_response():
    return Response({'error': 'The reset link expired or has been used already...'}, status=status.HTTP_400_BAD_REQUEST)


def _missing_token_response():
    return Response({'error': 'Reset link does not exist...'}, status=status.HTTP_400_BAD_REQUEST)


def _password_reset_success_response():
    return Response({'message': 'Password reset successfully!'}, status=status.HTTP_200_OK)


def _confirm_reset(serialiser):
    user = _do_reset(serialiser.validated_data['token'], serialiser.validated_data['new_password'])
    logger.info(f"Password reset for user: {user.username}")
    return _password_reset_success_response()


def _validated_confirm_serialiser(request):
    serialiser = ResetPasswordConfirmSerialiser(data=request.data)
    if serialiser.is_valid():
        return serialiser, None
    return None, Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)


def _confirm_reset_result(serialiser):
    try:
        return _confirm_reset(serialiser)
    except ValueError:
        return _invalid_token_response()
    except ResetPasswordToken.DoesNotExist:
        return _missing_token_response()
    except (DatabaseError, Exception) as exc:
        return _handle_reset_error(exc)

@api_view(['POST'])
def confirm_password_reset_view(request):
    """Confirm a token-based password reset and update the user's password."""

    serialiser, error_response = _validated_confirm_serialiser(request)
    if error_response:
        return error_response
    return _confirm_reset_result(serialiser)
