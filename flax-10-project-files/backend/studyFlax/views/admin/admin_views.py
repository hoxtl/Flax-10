"""Admin views for user management, teacher role requests, and society reports."""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from studyFlax.models.society.societyReportModel import SocietyReport
from studyFlax.models.society.societyMembershipModel import SocietyMembership
from studyFlax.models.notifications.notificationModel import Notification

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_list(request):
    """Return all users with basic info for the admin dashboard."""
    users = User.objects.all().order_by('date_joined')
    data = [_serialize_user(u) for u in users]
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def ban_user(request, user_id):
    """Ban or unban a user by their ID."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if user.is_staff:
        return Response({'error': 'Cannot ban staff users'}, status=status.HTTP_400_BAD_REQUEST)

    action = request.data.get('action', 'ban')
    if action not in ('ban', 'unban'):
        return Response({'error': 'Invalid action. Use "ban" or "unban".'}, status=status.HTTP_400_BAD_REQUEST)

    return _apply_ban_action(user, action, request.data.get('reason', ''))

def _apply_ban_action(user, action, reason):
    """Apply a ban or unban action to a user and return the response."""
    is_ban = action == 'ban'
    user.is_active = not is_ban
    user.ban_reason = reason if is_ban else ''
    user.save()
    verb = 'banned' if is_ban else 'unbanned'
    return Response({'message': f'{user.username} has been {verb}.', 'is_active': user.is_active})

@api_view(['GET'])
@permission_classes([IsAdminUser])
def teacher_requests(request):
    """List all users who have requested the teacher role."""
    users = User.objects.filter(role='pending_teacher').order_by('date_joined')
    data = [_serialize_user(u) for u in users]
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_teacher_request(request, user_id):
    """Approve or reject a pending teacher role request."""
    try:
        user = User.objects.get(id=user_id, role='pending_teacher')
    except User.DoesNotExist:
        return Response(
            {'error': 'No pending teacher request found for this user'},
            status=status.HTTP_404_NOT_FOUND,
        )
    decision = request.data.get('decision')
    if decision not in ('approve', 'reject'):
        return Response(
            {'error': 'Invalid decision. Use "approve" or "reject".'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return _apply_teacher_decision(user, decision)

def _apply_teacher_decision(user, decision):
    """Update user role and send notification based on the admin decision."""
    approved = decision == 'approve'
    user.role = 'teacher' if approved else 'student'
    user.save()

    title, message, url = _teacher_notification_content(approved)
    Notification.objects.create(
        user=user, title=title, message=message,
        notification_type='general', action_url=url,
    )

    verb = 'granted to' if approved else 'rejected for'
    return Response({'message': f'Teacher role {verb} {user.username}.'})

def _teacher_notification_content(approved):
    """Return notification title, message, and URL for a teacher role decision."""
    if approved:
        return (
            'Teacher role approved',
            'Your request for teacher access has been approved! You can now create and manage modules.',
            '/modules',
        )
    return (
        'Teacher request rejected',
        'Your request for teacher access was rejected. You can submit a new request from settings.',
        '/settings?tab=course',
    )

@api_view(['GET'])
@permission_classes([IsAdminUser])
def reported_societies(request):
    """List all reported societies with report details."""
    reports = SocietyReport.objects.select_related('society', 'reporter').order_by('-created_at')
    data = [_serialize_report(r) for r in reports]
    return Response(data)

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def dismiss_report(request, report_id):
    """Dismiss (delete) a specific society report."""
    try:
        report = SocietyReport.objects.get(id=report_id)
    except SocietyReport.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)
    report.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def ban_reported_society(request, report_id):
    """Ban a reported society: notify the creator and delete the society."""
    reason = (request.data.get('reason') or '').strip()

    try:
        report = SocietyReport.objects.select_related('society').get(id=report_id)
    except SocietyReport.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

    society = report.society
    creator = _find_society_creator(society)
    if creator:
        _notify_society_ban(creator, society.name, reason)

    society.delete()
    return Response({'message': 'Society banned and deleted successfully.'}, status=status.HTTP_200_OK)

def _find_society_creator(society):
    """Return the earliest admin member of a society, or None."""
    membership = (
        SocietyMembership.objects
        .filter(society=society, role='admin')
        .select_related('user')
        .order_by('joined_at', 'id')
        .first()
    )
    return membership.user if membership else None

def _notify_society_ban(creator, society_name, reason):
    """Send a ban notification to the society creator."""
    message = f'Your society "{society_name}" has been banned by an administrator.'
    if reason:
        message += f' Reason: {reason}'
    Notification.objects.create(
        user=creator, title=f'Society banned: {society_name}',
        message=message, notification_type='general', action_url='societies',
    )

@api_view(['POST'])
def request_teacher_role(request):
    """Allow a student to request the teacher role."""
    user = request.user
    if not user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    if user.role == 'teacher':
        return Response({'error': 'You are already a teacher'}, status=status.HTTP_400_BAD_REQUEST)
    if user.role == 'pending_teacher':
        return Response({'error': 'You already have a pending request'}, status=status.HTTP_400_BAD_REQUEST)
    user.role = 'pending_teacher'
    user.save()
    return Response({'message': 'Teacher role request submitted successfully.'})

@api_view(['POST'])
def cancel_teacher_role_request(request):
    """Allow a pending_teacher to cancel their request and revert to student."""
    user = request.user
    if not user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    if user.role != 'pending_teacher':
        return Response({'error': 'No pending teacher request to cancel'}, status=status.HTTP_400_BAD_REQUEST)
    user.role = 'student'
    user.save()
    return Response({'message': 'Teacher role request cancelled.'})

def _serialize_user(u):
    """Serialise a user object into a dictionary for API responses."""
    return {
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'first_name': u.first_name,
        'last_name': u.last_name,
        'role': u.role,
        'is_active': u.is_active,
        'is_staff': u.is_staff,
        'is_superuser': u.is_superuser,
        'date_joined': u.date_joined,
        'ban_reason': u.ban_reason,
    }

def _serialize_report(r):
    """Serialise a society report into a dictionary for API responses."""
    return {
        'id': r.id,
        'society_id': r.society.id,
        'society_name': r.society.name,
        'reporter_id': r.reporter.id,
        'reporter_username': r.reporter.username,
        'reason': r.reason,
        'created_at': r.created_at,
    }
