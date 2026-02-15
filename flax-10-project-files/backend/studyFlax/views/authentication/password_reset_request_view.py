from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from studyFlax.models import User
from studyFlax.models.auth.resetPasswordTokenModel import ResetPasswordToken
from studyFlax.serialisers.reset_password_serialisers import ResetPasswordSerialiser
from studyFlax.utils.email_utils import send_reset_password_email
from django.conf import settings
import logging


logger = logging.getLogger(__name__)


@api_view(['POST'])
def reset_password_view(request):
    """
    View function for password reset: email sent to user with reset URL
    """
    serialiser = ResetPasswordSerialiser(data=request.data)

    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user_email = serialiser.validated_data['email']

    try:
        user = User.objects.get(email=user_email)

        #Change previously created tokens to used
        ResetPasswordToken.objects.filter(user=user, token_used=False).update(token_used=True)

        new_token = ResetPasswordToken.create_user_token(user)

        reset_link = f"{settings.FRONTEND_URL}/reset-password/{new_token.token}"

        send_reset_password_email(user=user, reset_link=reset_link)
        logger.info(f"Password reset link sent successfully")
    
    except User.DoesNotExist:
        logger.warning(f"No user with such email found")
        pass
    except Exception as e:
        logger.error(f"Following error occurred: {str(e)}")
        return Response({'error': "Error when sending reset password email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({'message': "Reset password email sent."}, status=status.HTTP_200_OK)