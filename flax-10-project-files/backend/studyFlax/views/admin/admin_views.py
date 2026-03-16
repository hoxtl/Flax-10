from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from studyFlax.models.society.societyReportModel import SocietyReport
from studyFlax.models.society.societyMembershipModel import SocietyMembership
from studyFlax.models.notifications.notificationModel import Notification

User = get_user_model()

# Users

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

    reason = request.data.get('reason', '')
    action = request.data.get('action', 'ban')  # 'ban' or 'unban'

    if action == 'ban':
        user.is_active = False
        user.ban_reason = reason
        user.save()
        return Response({'message': f'{user.username} has been banned.', 'is_active': False})
    elif action == 'unban':
        user.is_active = True
        user.ban_reason = ''
        user.save()
        return Response({'message': f'{user.username} has been unbanned.', 'is_active': True})
    else:
        return Response({'error': 'Invalid action. Use "ban" or "unban".'}, status=status.HTTP_400_BAD_REQUEST)

# Teacher Role requests

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
            status=status.HTTP_404_NOT_FOUND
        )

    decision = request.data.get('decision')
    if decision == 'approve':
        user.role = 'teacher'
        user.save()
        Notification.objects.create(
            user=user,
            title='Teacher role approved',
            message='Your request for teacher access has been approved! You can now create and manage modules.',
            notification_type='general',
            action_url='/modules',
        )
        return Response({'message': f'Teacher role granted to {user.username}.'})
    elif decision == 'reject':
        user.role = 'student'
        user.save()
        Notification.objects.create(
            user=user,
            title='Teacher request rejected',
            message='Your request for teacher access was rejected. You can submit a new request from settings.',
            notification_type='general',
            action_url='/settings?tab=course',
        )
        return Response({'message': f'Teacher request rejected for {user.username}.'})
    else:
        return Response({'error': 'Invalid decision. Use "approve" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)

# Reported Societies

@api_view(['GET'])
@permission_classes([IsAdminUser])
def reported_societies(request):
    """List all reported societies with report details."""
    reports = SocietyReport.objects.select_related('society', 'reporter').order_by('-created_at')
    data = [
        {
            'id': r.id,
            'society_id': r.society.id,
            'society_name': r.society.name,
            'reporter_id': r.reporter.id,
            'reporter_username': r.reporter.username,
            'reason': r.reason,
            'created_at': r.created_at,
        }
        for r in reports
    ]
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
    """Ban a reported society: notify creator and delete the society."""
    reason = (request.data.get('reason') or '').strip()

    try:
        report = SocietyReport.objects.select_related('society').get(id=report_id)
    except SocietyReport.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

    society = report.society
    creator_membership = (
        SocietyMembership.objects
        .filter(society=society, role='admin')
        .select_related('user')
        .order_by('joined_at', 'id')
        .first()
    )
    creator = creator_membership.user if creator_membership else None

    if creator:
        message = f'Your society "{society.name}" has been banned by an administrator.'
        if reason:
            message += f' Reason: {reason}'
        Notification.objects.create(
            user=creator,
            title=f'Society banned: {society.name}',
            message=message,
            notification_type='general',
            action_url='societies',
        )

    society.delete()
    return Response({'message': 'Society banned and deleted successfully.'}, status=status.HTTP_200_OK)

# Allow students to request teacher role

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

# Helper functions

def _serialize_user(u):
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