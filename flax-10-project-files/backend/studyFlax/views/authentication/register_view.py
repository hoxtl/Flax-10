"""
View for new user registration.
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from studyFlax.models import User
from rest_framework.authtoken.models import Token
from studyFlax.serialisers.auth.auth_serialisers import RegistrationUserSerialiser, UserSerialiser
from studyFlax.views.user.settings_views import get_or_create_user_settings

@api_view(['POST'])
def register_view(request):
    """View method for new user registration."""
    user_serialiser = RegistrationUserSerialiser(data=request.data)
    if not user_serialiser.is_valid():
        return Response(user_serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    new_user = User.objects.create_user(
        username=user_serialiser.validated_data['username'],
        password=user_serialiser.validated_data['password'],
        email=user_serialiser.validated_data['email'],
        first_name=user_serialiser.validated_data['first_name'],
        last_name=user_serialiser.validated_data['last_name']
    )
    get_or_create_user_settings(new_user)
    token, _ = Token.objects.get_or_create(user=new_user)
    return Response({'user': UserSerialiser(new_user).data,
                    'token': token.key}, status=status.HTTP_201_CREATED)
