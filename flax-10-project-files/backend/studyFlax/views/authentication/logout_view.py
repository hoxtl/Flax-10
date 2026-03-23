"""
View for user logout.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """View method for user logout."""

    try:
        token = request.user.auth_token
    except ObjectDoesNotExist:
        return Response({'message': 'No active session to clear.'}, status=status.HTTP_200_OK)
    token.delete()
    return Response({'message': 'User logged out successfully!'}, status=status.HTTP_200_OK)
