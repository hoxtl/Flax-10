from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.society import Society, SocietyImage, SocietyReport
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
        return get_society_detail(request.user, society)
    if request.method == 'PATCH':
        return update_society(request, society)
    return delete_society(request, society)


def get_society_detail(user, society):
    data = SocietyDetailSerialiser(society).data
    membership = get_membership(user, society)
    data['is_member'] = membership is not None
    data['is_admin'] = membership.is_admin if membership else False
    data['role'] = membership.role if membership else None
    return Response(data)


def update_society(request, society):
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    serialiser = SocietyDetailSerialiser(society, data=request.data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    handle_image_urls(society, request.data)
    society.refresh_from_db()
    return get_society_detail(request.user, society)




def delete_society(request, society):
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    delete_society_with_notification(society)
    return Response(status=status.HTTP_204_NO_CONTENT)


def delete_society_with_notification(society):
    """Delete society with only one notification (no event/announcement spam)."""
    from studyFlax.signals.society_notifications import (
        notify_society_deleted, delete_children_silently
    )
    notify_society_deleted(society)
    delete_children_silently(society)
    society._skip_notification = True
    society.delete()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_society(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()
    
    reason = request.data.get('reason')
    if not reason or not reason.strip():
        return Response({'error': 'Reason is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    SocietyReport.objects.create(
        society=society,
        reporter=request.user,
        reason=reason.strip()
    )
    
    return Response({'message': 'Report submitted successfully'}, status=status.HTTP_201_CREATED)
