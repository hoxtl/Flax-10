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


def _auth_failure_response():
    return Response({'error': 'Credentials are not valid!'}, status=status.HTTP_401_UNAUTHORIZED)


def _auth_success_response(logged_user, request):
    token, _ = Token.objects.get_or_create(user=logged_user)
    return Response({'user': UserSerialiser(logged_user, context={'request': request}).data, 'token': token.key})


def _login_input(request):
    user_serialiser = LoggedUserSerialiser(data=request.data)
    if user_serialiser.is_valid():
        return user_serialiser, None
    return None, Response(user_serialiser.errors, status=status.HTTP_400_BAD_REQUEST)


def _authenticate_user(user_serialiser):
    username = user_serialiser.validated_data['username']
    password = user_serialiser.validated_data['password']
    ban_response = _build_ban_response(_get_candidate(username), password)
    if ban_response:
        return None, ban_response
    return authenticate(username=username, password=password), None

@api_view(['POST'])
def login_view(request):
    """Log in a user, returning a token or an appropriate error response."""

    return _login_response(request)


def _login_response(request):
    user_serialiser, error_response = _login_input(request)
    if error_response:
        return error_response
    logged_user, auth_error = _authenticate_user(user_serialiser)
    if auth_error:
        return auth_error
    if logged_user is None:
        return _auth_failure_response()
    return _auth_success_response(logged_user, request)
