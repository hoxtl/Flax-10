from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, get_user_model
from rest_framework.authtoken.models import Token
from studyFlax.serialisers.auth_serialisers import UserSerialiser, LoggedUserSerialiser

User = get_user_model()


@api_view(['POST'])
def login_view(request):
    """
    View method for user login.
    Returns 403 with ban details if the account is suspended.
    """
    user_serialiser = LoggedUserSerialiser(data=request.data)
    if not user_serialiser.is_valid():
        return Response(user_serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

    username = user_serialiser.validated_data['username']
    password = user_serialiser.validated_data['password']

    # Check if user exists and password is correct but the account is banned
    try:
        candidate = User.objects.get(username=username)
        if candidate.check_password(password) and not candidate.is_active:
            return Response(
                {
                    'error': 'Account suspended',
                    'is_banned': True,
                    'ban_reason': candidate.ban_reason,
                },
                status=status.HTTP_403_FORBIDDEN,
            )
    except User.DoesNotExist:
        pass

    logged_user = authenticate(username=username, password=password)
    if logged_user is not None:
        token, _ = Token.objects.get_or_create(user=logged_user)
        return Response(
            {'user': UserSerialiser(logged_user).data, 'token': token.key},
            status=status.HTTP_200_OK,
        )
    return Response({'error': 'Credentials are not valid!'}, status=status.HTTP_401_UNAUTHORIZED)