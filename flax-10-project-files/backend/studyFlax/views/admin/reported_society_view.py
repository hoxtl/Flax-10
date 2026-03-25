"""
Reported society admin views.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from studyFlax.models.notifications.notification_model import Notification
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.models.society.society_report_model import SocietyReport


def serialise_report(report):
    return {
        'id': report.id,
        'society_id': report.society.id,
        'society_name': report.society.name,
        'reporter_id': report.reporter.id,
        'reporter_username': report.reporter.username,
        'reason': report.reason,
        'created_at': report.created_at,
    }


def report_not_found():
    return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)


def get_report_or_response(report_id):
    try:
        return SocietyReport.objects.select_related('society').get(id=report_id), None
    except SocietyReport.DoesNotExist:
        return None, report_not_found()


def find_society_creator(society):
    membership = SocietyMembership.objects.filter(society=society, role='admin').select_related('user').order_by('joined_at', 'id').first()
    return membership.user if membership else None


def notify_society_ban(creator, society_name, reason):
    message = f'Your society "{society_name}" has been banned by an administrator.'
    message = f'{message} Reason: {reason}' if reason else message
    Notification.objects.create(user=creator, title=f'Society banned: {society_name}', message=message, notification_type='general', action_url='societies')


def _ban_society(report, reason):
    creator = find_society_creator(report.society)
    if creator:
        notify_society_ban(creator, report.society.name, reason)
    report.society.delete()


@api_view(['GET'])
@permission_classes([IsAdminUser])
def reported_societies(request):
    reports = SocietyReport.objects.select_related('society', 'reporter').order_by('-created_at')
    return Response([serialise_report(report) for report in reports])


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def dismiss_report(request, report_id):
    report, error = get_report_or_response(report_id)
    if error:
        return error
    report.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def ban_reported_society(request, report_id):
    report, error = get_report_or_response(report_id)
    if error:
        return error
    reason = (request.data.get('reason') or '').strip()
    _ban_society(report, reason)
    return Response({'message': 'Society banned and deleted successfully.'}, status=status.HTTP_200_OK)
