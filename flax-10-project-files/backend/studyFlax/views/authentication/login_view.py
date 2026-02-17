from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from studyFlax.serialisers.auth_serialisers import UserSerialiser, LoggedUserSerialiser


@api_view(['POST'])
def login_view(request):
    """
    View method for user login.
    """
    user_serialiser = LoggedUserSerialiser(data=request.data)
    if not user_serialiser.is_valid():
        return Response(user_serialiser.errors, status=status.HTTP_400_BAD_REQUEST) 
    logged_user = authenticate(
        username=user_serialiser.validated_data['username'],
        password=user_serialiser.validated_data['password']
    )
    if logged_user is not None:
        token, new_token = Token.objects.get_or_create(user=logged_user)

        return Response({'user': UserSerialiser(logged_user).data, 
                        'token': token.key}, status=status.HTTP_200_OK)
    return Response({'error': 'Credentials are not valid!'}, status=status.HTTP_401_UNAUTHORIZED)                