"""
Views for retrieving and updating user profile data.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models import User

from .profile_helpers import apply_profile_patch, build_profile_response
from .study_session_suggestions import create_study_suggestion, get_target_user, validate_target_user


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    if request.method == 'GET':
        return Response(build_profile_response(request.user, request))
    error = apply_profile_patch(request.user, request.data, request.FILES)
    if error:
        return error
    return Response(build_profile_response(request.user, request))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def another_user_profile_view(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(build_profile_response(user, request))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def suggest_study_session_view(request):
    target_user_id = request.data.get('target_user_id')
    if not target_user_id:
        return Response({'error': 'target_user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    target_user = get_target_user(target_user_id)
    error = validate_target_user(target_user, request.user)
    if error:
        return error
    create_study_suggestion(target_user, request.user, request.data)
    return Response({'message': 'Study session suggestion sent'}, status=status.HTTP_201_CREATED)
