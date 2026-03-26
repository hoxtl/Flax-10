"""
Views for society detail, update, deletion, and reporting.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.society import SocietyReport
from studyFlax.models.notifications.notification_model import Notification
from django.contrib.auth import get_user_model
from studyFlax.serialisers import SocietyDetailSerialiser
from .helpers import (
    get_society_or_404, get_membership, is_society_admin,
    society_not_found_response, permission_denied_response,
    handle_image_urls
)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def society_detail(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    if request.method == 'GET':
        return get_society_detail(request, society)
    if request.method == 'PATCH':
        return update_society(request, society)
    return delete_society(request, society)

def get_society_detail(request, society):
    """Return a serialised society detail response with membership context."""
    data = SocietyDetailSerialiser(society, context={'request': request}).data
    membership = get_membership(request.user, society)
    data['is_member'] = membership is not None
    data['is_admin'] = membership.is_admin if membership else False
    data['role'] = membership.role if membership else None
    data['is_subscribed'] = membership.is_subscribed if membership else False

    return Response(data)

def update_society(request, society):
    """Update a society's details (admin only)."""
    permission_response = _society_detail_admin_error(request.user, society)
    if permission_response:

        return permission_response
    return _updated_society_response(request, society)

def _society_detail_admin_error(user, society):

    if is_society_admin(user, society):
        return None
    return permission_denied_response()

def _updated_society_response(request, society):
    serialiser = SocietyDetailSerialiser(society, data=request.data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

    serialiser.save()
    handle_image_urls(society, request.data)
    society.refresh_from_db()
    return get_society_detail(request, society)

def delete_society(request, society):
    """Delete a society and notify all members (admin only)."""
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    delete_society_with_notification(society)
    return Response(status=status.HTTP_204_NO_CONTENT)

def delete_society_with_notification(society):
    """Delete society with only one notification (no event/announcement spam)."""
    from studyFlax.signals.society_notifications import (
        notify_society_deleted, delete_children_silently, _deleting_societies

    )
    _deleting_societies.add(society.pk)
    notify_society_deleted(society)
    delete_children_silently(society)
    society._skip_notification = True
    society.delete()

def _notify_admins_of_report(society, reason):
    """Send a report notification to all superusers."""
    User = get_user_model()
    Notification.objects.bulk_create([

        Notification(
            user=admin_user, title=f"New report for {society.name}",

            message=f"Reason: {reason}", notification_type='society_report',
            action_url='admin', society_id=society.id,
        )
        for admin_user in User.objects.filter(is_superuser=True)
    ])

def _remove_society_report(society, user):
    SocietyReport.objects.filter(society=society, reporter=user).delete()

def _clean_report_reason(request):
    reason = request.data.get('reason')
    if not reason or not reason.strip():

        return None
    return reason.strip()

def _create_society_report(society, user, reason):

    SocietyReport.objects.get_or_create(
        society=society, reporter=user, defaults={'reason': reason},
    )

def _report_removed_response():

    return Response({'message': 'Report removed successfully'}, status=status.HTTP_200_OK)

def _report_reason_required_response():
    return Response({'error': 'Reason is required'}, status=status.HTTP_400_BAD_REQUEST)

def _report_submitted_response():
    return Response({'message': 'Report submitted successfully'}, status=status.HTTP_201_CREATED)

def _submit_society_report(request, society):

    payload, errors, status_code = _society_report_result(request, society)
    if errors:
        return Response(errors, status=status_code)
    return Response(payload, status=status_code)

def _society_report_result(request, society):
    reason = _clean_report_reason(request)
    if not reason:
        return _society_report_error_result()
    return _society_report_success_result(request.user, society, reason)

def _society_report_error_result():
    response = _report_reason_required_response()
    return None, response.data, response.status_code

def _society_report_success_result(user, society, reason):
    _create_society_report(society, user, reason)
    _notify_admins_of_report(society, reason)
    response = _report_submitted_response()
    return response.data, None, response.status_code

@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def report_society(request, society_id):
    """Submit or remove a report for a society."""
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()
    if request.method == 'DELETE':
        _remove_society_report(society, request.user)
        return _report_removed_response()
    return _submit_society_report(request, society)
