"""
Views for managing course change requests by users and admins.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db import DatabaseError

from studyFlax.models.authentication.course_change_request_model import CourseChangeRequest
from studyFlax.serialisers.modules.course_change_serialisers import CourseChangeRequestSerialiser
from studyFlax.views.user.settings_view import get_or_create_user_settings
from studyFlax.views.admin.course_change_service import (
    apply_decision,
    can_delete_pending_request,
    delete_pending_request,
    handle_request_creation,
    handle_request_creation_error,
    serialise_optional_request,
    validate_decision,
)


def _get_user_settings(user):
    """Return user settings with course-related defaults."""
    return get_or_create_user_settings(user, {'major': '', 'year': ''})

def _latest_course_change_request(user):
    return CourseChangeRequest.objects.filter(user=user).order_by('-created_at').first()

def _cancel_pending_request(user):
    change_request = _latest_course_change_request(user)
    if not can_delete_pending_request(change_request):
        return Response({'error': 'No pending request to cancel'}, status=status.HTTP_404_NOT_FOUND)
    delete_pending_request(change_request)
    return Response({'message': 'Course change request cancelled.'}, status=status.HTTP_200_OK)

def _apply_decision(change_request, decision, get_user_settings):
    apply_decision(change_request, decision, get_user_settings)

def _resolve_course_change_data(change_request, decision):
    _apply_decision(change_request, decision, _get_user_settings)
    return CourseChangeRequestSerialiser(change_request).data

def _course_change_or_none(request_id):
    try:
        return CourseChangeRequest.objects.select_related('user').get(pk=request_id)
    except CourseChangeRequest.DoesNotExist:
        return None

def _resolved_course_change_response(change_request, decision):
    try:
        return Response(_resolve_course_change_data(change_request, decision))
    except DatabaseError:
        return Response({'error': 'Unable to update request right now.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_course_change(request):
    """Submit a request to change the user's enrolled course."""
    requested_course = (request.data.get('requested_course') or '').strip()
    if not requested_course:
        return Response({'error': 'requested_course is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        data = handle_request_creation(request.user, requested_course, _get_user_settings)
        return Response(data, status=status.HTTP_201_CREATED)
    except (ValueError, DatabaseError) as error:
        return handle_request_creation_error(error)

@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def my_course_change_request(request):
    """Retrieve or cancel the current user's latest course change request."""
    if request.method == 'DELETE':
        return _cancel_pending_request(request.user)
    return Response(serialise_optional_request(_latest_course_change_request(request.user)))

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_course_change_requests(request):
    qs = CourseChangeRequest.objects.filter(status='pending').select_related('user')
    return Response(CourseChangeRequestSerialiser(qs, many=True).data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_course_change_request(request, request_id):
    """Approve or reject a pending course change request."""
    change_request = _course_change_or_none(request_id)
    if change_request is None:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    decision = request.data.get('decision')
    decision_error = validate_decision(decision)
    if decision_error:
        return decision_error
    return _resolved_course_change_response(change_request, decision)
