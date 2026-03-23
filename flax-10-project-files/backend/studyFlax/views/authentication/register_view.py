"""
View for new user registration.
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from studyFlax.models import User
from rest_framework.authtoken.models import Token
from studyFlax.serialisers.auth.auth_serialisers import RegistrationUserSerialiser, UserSerialiser
from studyFlax.views.user.settings_view import get_or_create_user_settings

def _create_registered_user(validated_data):
    return User.objects.create_user(
        username=validated_data['username'],
        password=validated_data['password'],
        email=validated_data['email'],
        first_name=validated_data['first_name'],
        last_name=validated_data['last_name']
    )

def _build_registration_response(user, request):
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            'user': UserSerialiser(user, context={'request': request}).data,
            'token': token.key,
        },
        status=status.HTTP_201_CREATED,
    )

@api_view(['POST'])
def register_view(request):
    """View method for new user registration."""
    user_serialiser = RegistrationUserSerialiser(data=request.data)
    if not user_serialiser.is_valid():
        return Response(user_serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    new_user = _create_registered_user(user_serialiser.validated_data)
    get_or_create_user_settings(new_user)
    return _build_registration_response(new_user, request)
