"""
View for checking whether a username is available.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models import User


def _username_error(message):
    return Response({'available': False, 'error': message})

def _username_exists(username, user_id):
    return User.objects.filter(username=username).exclude(id=user_id).exists()

def _invalid_username_message(username):
    if not username:
        return 'Username is required'
    if len(username) < 3:
        return 'Username must be at least 3 characters'
    return None

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_username(request):
    return _username_check_response(request)

def _username_check_response(request):
    username = request.data.get('username', '').strip()
    error_message = _invalid_username_message(username)
    if error_message:
        return _username_error(error_message)
    exists = _username_exists(username, request.user.id)
    return Response({'available': not exists})
