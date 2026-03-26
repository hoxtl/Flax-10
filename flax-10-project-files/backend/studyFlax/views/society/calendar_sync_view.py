"""
Views for syncing and unsyncing society events with a user's calendar.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.society import SocietyCalendarSync
from .helpers import get_society_or_404, get_membership, society_not_found_response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sync_status(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()
    is_synced = SocietyCalendarSync.objects.filter(user=request.user, society=society).exists()
    return Response({'is_synced': is_synced})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_calendar(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()
    if not get_membership(request.user, society):
        return Response({'error': 'Must be a member to sync'}, status=status.HTTP_403_FORBIDDEN)
    sync, created = SocietyCalendarSync.objects.get_or_create(user=request.user, society=society)

    return Response({'is_synced': True, 'created': created}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unsync_calendar(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    deleted = _delete_sync_record(request.user, society)
    return Response({'is_synced': False, 'deleted': deleted > 0})

def _delete_sync_record(user, society):
    deleted, _ = SocietyCalendarSync.objects.filter(user=user, society=society).delete()
    return deleted
