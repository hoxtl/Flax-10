"""
Views for listing, creating, and publishing changes to societies.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.society import Society, SocietyMembership
from studyFlax.serialisers import SocietyListSerialiser
from studyFlax.signals.society_notifications import notify_society_members
from .helpers import (
    get_membership,
    get_society_or_404,
    handle_image_urls,
    is_society_admin,
    permission_denied_response,
    society_not_found_response,
)
from .notification_helpers import build_update_notification

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def society_list(request):
    if request.method == 'GET':
        return get_societies(request)
    return create_society(request)

def get_societies(request):
    societies = Society.objects.all()
    data = build_society_list_data(societies, request)
    return Response(data)

def build_society_list_data(societies, request):
    result = []
    for society in societies:
        society_data = SocietyListSerialiser(society, context={'request': request}).data
        membership = get_membership(request.user, society)
        society_data['is_member'] = membership is not None
        society_data['is_admin'] = membership.is_admin if membership else False
        result.append(society_data)
    return result

def create_society(request):
    data = request.data.copy()
    if not data.get('admin_emails'):
        data['admin_emails'] = request.user.email
    serialiser = SocietyListSerialiser(data=data, context={'request': request})
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    society = serialiser.save()
    handle_image_urls(society, request.data)
    SocietyMembership.objects.create(user=request.user, society=society, role='admin')
    return Response(serialiser.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_changes(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    changes = request.data
    notification = build_update_notification(society, changes)
    notify_society_members(society, notification)
    return Response({'status': 'published'})
