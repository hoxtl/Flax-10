import traceback

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from studyFlax.models.auth.courseChangeRequestModel import CourseChangeRequest
from studyFlax.models.auth.userSettingsModel import UserSettings
from studyFlax.models.notifications.notificationModel import Notification
from studyFlax.serialisers.course_change_serialisers import CourseChangeRequestSerialiser


def _get_user_settings(user):
    """Get or create user settings safely, always providing required field defaults."""
    obj, _ = UserSettings.objects.get_or_create(
        user=user,
        defaults={
            'theme': 'light',
            'timezone': 'Europe/London',
            'major': '',
            'year': '',
        },
    )
    return obj


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_course_change(request):
    try:
        requested_course = (request.data.get('requested_course') or '').strip()
        if not requested_course:
            return Response(
                {'error': 'requested_course is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        settings_obj = _get_user_settings(request.user)
        current_course = settings_obj.major or ''

        if requested_course == current_course:
            return Response(
                {'error': 'Requested course is the same as your current course'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if CourseChangeRequest.objects.filter(user=request.user, status='pending').exists():
            return Response(
                {'error': 'You already have a pending course change request'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        req = CourseChangeRequest.objects.create(
            user=request.user,
            requested_course=requested_course,
            current_course=current_course,
        )
        return Response(CourseChangeRequestSerialiser(req).data, status=status.HTTP_201_CREATED)

    except Exception as e:
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def my_course_change_request(request):
    try:
        req = (
            CourseChangeRequest.objects
            .filter(user=request.user)
            .order_by('-created_at')
            .first()
        )
        if request.method == 'DELETE':
            if not req or req.status != 'pending':
                return Response({'error': 'No pending request to cancel'}, status=status.HTTP_404_NOT_FOUND)
            req.delete()
            return Response({'message': 'Course change request cancelled.'}, status=status.HTTP_200_OK)
        if not req:
            return Response(None)
        return Response(CourseChangeRequestSerialiser(req).data)
    except Exception as e:
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_course_change_requests(request):
    try:
        qs = CourseChangeRequest.objects.filter(status='pending').select_related('user')
        return Response(CourseChangeRequestSerialiser(qs, many=True).data)
    except Exception as e:
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_course_change_request(request, request_id):
    try:
        req = CourseChangeRequest.objects.select_related('user').get(pk=request_id)
    except CourseChangeRequest.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
    try:
        decision = request.data.get('decision')
        if decision not in ('approve', 'reject'):
            return Response(
                {'error': "decision must be 'approve' or 'reject'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        req.status = 'approved' if decision == 'approve' else 'rejected'
        req.resolved_at = timezone.now()
        req.save()

        if req.status == 'approved':
            settings_obj = _get_user_settings(req.user)
            settings_obj.major = req.requested_course
            settings_obj.save()
            Notification.objects.create(
                user=req.user,
                title='Course change approved',
                message=f'Your request to change to {req.requested_course} has been approved. Your course has been updated.',
                notification_type='general',
                action_url='/settings?tab=account',
            )
        else:
            Notification.objects.create(
                user=req.user,
                title='Course change rejected',
                message=f'Your request to change to {req.requested_course} was rejected. You can submit a new request from settings.',
                notification_type='general',
                action_url='/settings?tab=account',
            )

        return Response(CourseChangeRequestSerialiser(req).data)
    except Exception as e:
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
