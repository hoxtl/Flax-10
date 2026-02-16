from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from studyFlax.models.auth.resetPasswordTokenModel import ResetPasswordToken
from studyFlax.serialisers.reset_password_serialisers import ResetPasswordConfirmSerialiser
import logging


logger = logging.getLogger(__name__)


@api_view(['POST'])
def confirm_password_reset_view(request):
    """
    View function to confirm token-based user password reset
    """
    serialiser = ResetPasswordConfirmSerialiser(data=request.data)

    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    user_token = serialiser.validated_data['token']
    new_user_password = serialiser.validated_data['new_password']

    try:
        token = ResetPasswordToken.objects.get(token=user_token)

        if not token.is_token_valid():
            return Response({'error': 'The reset link expired or has been used already...'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = token.user
        user.set_password(new_user_password)
        user.save()

        token.token_used = True
        token.save()

        logger.info(f"Password reset link sent to user: {user.username}")

        return Response({'message': 'Password reset successfully! '}, status=status.HTTP_200_OK)
    
    except ResetPasswordToken.DoesNotExist:
        return Response({'error': 'Reset link does not exist...'}, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Following error occurred when trying to reset password: {str(e)}")
        return Response({'error': 'Error occurred for password reset confirmation...'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)