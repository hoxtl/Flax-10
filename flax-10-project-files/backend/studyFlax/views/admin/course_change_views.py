"""
Views for managing course change requests by users and admins.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db import DatabaseError

from studyFlax.models.auth.courseChangeRequestModel import CourseChangeRequest
from studyFlax.models.notifications.notificationModel import Notification
from studyFlax.models import Enrollment, CalendarEvent
from studyFlax.serialisers.modules.course_change_serialisers import CourseChangeRequestSerialiser
from studyFlax.views.user.settings_views import get_modules_for_major, enroll_user_in_modules
from studyFlax.views.user.settings_views import get_or_create_user_settings

def _get_user_settings(user):
    """Return user settings with course-related defaults."""
    return get_or_create_user_settings(user, {'major': '', 'year': ''})

def _create_course_change_request(user, requested_course):
    """Validate and create a course change request."""
    settings_obj = _get_user_settings(user)
    current_course = settings_obj.major or ''
    if requested_course == current_course:
        raise ValueError('Requested course is the same as your current course')
    if CourseChangeRequest.objects.filter(user=user, status='pending').exists():
        raise ValueError('You already have a pending course change request')
    return CourseChangeRequest.objects.create(
        user=user, requested_course=requested_course, current_course=current_course,
    )

def _handle_delete_request(req):
    """Cancel a pending course change request and return the appropriate response."""
    if not req or req.status != 'pending':
        return Response({'error': 'No pending request to cancel'}, status=status.HTTP_404_NOT_FOUND)
    req.delete()
    return Response({'message': 'Course change request cancelled.'}, status=status.HTTP_200_OK)

def _clear_existing_enrollments(user, old_module_ids):
    CalendarEvent.objects.filter(
        user=user, module_id__in=old_module_ids,
        source__in=['module_enrollment', 'module_deadline'],
    ).delete()
    Enrollment.objects.filter(student=user, module_id__in=old_module_ids).delete()

def _update_student_course(settings_obj, requested_course):
    settings_obj.major = requested_course
    settings_obj.save(update_fields=['major'])

def _notify_course_change_approved(req):
    Notification.objects.create(
        user=req.user, title='Course change approved',
        message=f'Your request to change to {req.requested_course} has been approved. Your course has been updated.',
        notification_type='general', action_url='/settings?tab=account',
    )

def _apply_approval(req):
    """Update user settings and enrolments when a course change is approved."""
    settings_obj = _get_user_settings(req.user)
    old_module_ids = [m.pk for m in get_modules_for_major(settings_obj.major)]
    _clear_existing_enrollments(req.user, old_module_ids)
    _update_student_course(settings_obj, req.requested_course)
    enroll_user_in_modules(req.user, get_modules_for_major(req.requested_course))
    _notify_course_change_approved(req)

def _apply_rejection(req):
    """Notify the user that their course change request was rejected."""
    Notification.objects.create(
        user=req.user, title='Course change rejected',
        message=f'Your request to change to {req.requested_course} was rejected. You can submit a new request from settings.',
        notification_type='general', action_url='/settings?tab=account',
    )

def _apply_approval_decision(req):
    """Apply approved decision side effects."""
    _apply_approval(req)

def _apply_rejection_decision(req):
    """Apply rejected decision side effects."""
    _apply_rejection(req)

def _apply_decision(req, decision):
    """Set the request status and apply approval or rejection side-effects."""
    req.status = 'approved' if decision == 'approve' else 'rejected'
    req.resolved_at = timezone.now()
    req.save()
    if req.status == 'approved':
        _apply_approval_decision(req)
    else:
        _apply_rejection_decision(req)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_course_change(request):
    """Submit a request to change the user's enrolled course."""
    requested_course = (request.data.get('requested_course') or '').strip()
    if not requested_course:
        return Response({'error': 'requested_course is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        req = _create_course_change_request(request.user, requested_course)
        return Response(CourseChangeRequestSerialiser(req).data, status=status.HTTP_201_CREATED)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except DatabaseError:
        return Response({'error': 'Unable to create request right now.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def my_course_change_request(request):
    """Retrieve or cancel the current user's latest course change request."""
    req = CourseChangeRequest.objects.filter(user=request.user).order_by('-created_at').first()
    if request.method == 'DELETE':
        return _handle_delete_request(req)
    return Response(CourseChangeRequestSerialiser(req).data if req else None)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_course_change_requests(request):
    """List all pending course change requests for admin review."""
    qs = CourseChangeRequest.objects.filter(status='pending').select_related('user')
    return Response(CourseChangeRequestSerialiser(qs, many=True).data)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_course_change_request(request, request_id):
    """Approve or reject a pending course change request."""
    try:
        req = CourseChangeRequest.objects.select_related('user').get(pk=request_id)
    except CourseChangeRequest.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    decision = request.data.get('decision')
    if decision not in ('approve', 'reject'):
        return Response({'error': "decision must be 'approve' or 'reject'"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        _apply_decision(req, decision)
        return Response(CourseChangeRequestSerialiser(req).data)
    except DatabaseError:
        return Response({'error': 'Unable to update request right now.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
