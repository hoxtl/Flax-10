"""
View for user logout.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """View method for user logout."""
    try:
        request.user.auth_token.delete()
        return Response({'message': 'User logged out successfully!'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Unable to log user out...'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
