"""
View for user login and token generation.
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, get_user_model
from rest_framework.authtoken.models import Token
from studyFlax.serialisers.auth.auth_serialisers import UserSerialiser, LoggedUserSerialiser

User = get_user_model()

def _get_candidate(username):
    """Return the User with this username, or None if not found."""
    try:
        return User.objects.get(username=username)
    except User.DoesNotExist:
        return None

def _build_ban_response(candidate, password):
    """Return a 403 Response if the account exists but is suspended, else None."""
    if candidate and candidate.check_password(password) and not candidate.is_active:
        return Response(
            {
                'error': 'Account suspended',
                'is_banned': True,
                'ban_reason': candidate.ban_reason,
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    return None

@api_view(['POST'])
def login_view(request):
    """Log in a user, returning a token or an appropriate error response."""
    user_serialiser = LoggedUserSerialiser(data=request.data)
    if not user_serialiser.is_valid():
        return Response(user_serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    username = user_serialiser.validated_data['username']
    password = user_serialiser.validated_data['password']
    ban_response = _build_ban_response(_get_candidate(username), password)
    if ban_response:
        return ban_response
    logged_user = authenticate(username=username, password=password)
    if logged_user is not None:
        token, _ = Token.objects.get_or_create(user=logged_user)
        return Response({'user': UserSerialiser(logged_user).data, 'token': token.key})
    return Response({'error': 'Credentials are not valid!'}, status=status.HTTP_401_UNAUTHORIZED)
