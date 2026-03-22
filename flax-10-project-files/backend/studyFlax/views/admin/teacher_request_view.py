"""
Teacher request admin and user views.
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from studyFlax.models.notifications.notification_model import Notification
from studyFlax.views.admin.user_management_view import serialise_user, not_found

User = get_user_model()


def authenticated_user_or_response(request):
    user = request.user
    if user.is_authenticated:
        return user, None
    response = Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    return None, response


def invalid_decision_response():
    return Response({'error': 'Invalid decision. Use "approve" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)


def get_pending_teacher_or_response(user_id):
    try:
        return User.objects.get(id=user_id, role='pending_teacher'), None
    except User.DoesNotExist:
        return None, not_found('No pending teacher request found for this user')


def teacher_notification_content(approved):
    if approved:
        return ('Teacher role approved', 'Your request for teacher access has been approved! You can now create and manage modules.', '/modules')
    return ('Teacher request rejected', 'Your request for teacher access was rejected. You can submit a new request from settings.', '/settings?tab=course')


def apply_teacher_decision(user, decision):
    approved = decision == 'approve'
    user.role = 'teacher' if approved else 'student'
    user.save()
    title, message, action_url = teacher_notification_content(approved)
    Notification.objects.create(user=user, title=title, message=message, notification_type='general', action_url=action_url)
    verb = 'granted to' if approved else 'rejected for'
    return Response({'message': f'Teacher role {verb} {user.username}.'})


def already_teacher_response():
    return Response({'error': 'You are already a teacher'}, status=status.HTTP_400_BAD_REQUEST)


def already_pending_response():
    return Response({'error': 'You already have a pending request'}, status=status.HTTP_400_BAD_REQUEST)


def no_pending_request_response():
    return Response({'error': 'No pending teacher request to cancel'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def teacher_requests(request):
    users = User.objects.filter(role='pending_teacher').order_by('date_joined')
    return Response([serialise_user(user) for user in users])


@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_teacher_request(request, user_id):
    user, error = get_pending_teacher_or_response(user_id)
    if error:
        return error
    decision = request.data.get('decision')
    if decision not in ('approve', 'reject'):
        return invalid_decision_response()
    return apply_teacher_decision(user, decision)


@api_view(['POST'])
def request_teacher_role(request):
    user, error = authenticated_user_or_response(request)
    if error:
        return error
    if user.role == 'teacher':
        return already_teacher_response()
    if user.role == 'pending_teacher':
        return already_pending_response()
    user.role = 'pending_teacher'
    user.save()
    return Response({'message': 'Teacher role request submitted successfully.'})


@api_view(['POST'])
def cancel_teacher_role_request(request):
    user, error = authenticated_user_or_response(request)
    if error:
        return error
    if user.role != 'pending_teacher':
        return no_pending_request_response()
    user.role = 'student'
    user.save()
    return Response({'message': 'Teacher role request cancelled.'})
