"""
Views for society announcement listing, creation, update, and deletion.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.society import SocietyAnnouncement, SocietyAnnouncementImage
from studyFlax.serialisers import SocietyAnnouncementSerialiser
from .helpers import (
    get_society_or_404,
    get_society_object_or_none,
    is_society_admin,
    is_silent_request,
    society_not_found_response,
    permission_denied_response,
)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def announcement_list(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    if request.method == 'GET':
        return get_announcements(society)
    return create_announcement(request, society, is_silent_request(request))

def get_announcements(society):
    announcements = SocietyAnnouncement.objects.filter(society=society)
    return Response(SocietyAnnouncementSerialiser(announcements, many=True).data)

def create_announcement(request, society, silent=False):
    payload, errors, status_code = create_announcement_result(request.user, request.data, society, silent)
    if errors:
        return Response(errors, status=status_code)
    return Response(payload, status=status_code)


def create_announcement_result(user, data, society, silent=False):
    if not is_society_admin(user, society):
        response = permission_denied_response()
        return None, response.data, response.status_code
    context = {'skip_notification': silent}
    serialiser = SocietyAnnouncementSerialiser(data=data, context=context)
    if not serialiser.is_valid():
        return None, serialiser.errors, status.HTTP_400_BAD_REQUEST
    announcement = serialiser.save(society=society)
    save_announcement_images(announcement, get_image_urls(data))
    announcement.refresh_from_db()
    return SocietyAnnouncementSerialiser(announcement).data, None, status.HTTP_201_CREATED

def get_image_urls(data):
    return data.get('images') or data.get('image_urls', [])

def save_announcement_images(announcement, image_urls):
    for i, url in enumerate(image_urls):
        SocietyAnnouncementImage.objects.create(announcement=announcement, url=url, order=i)

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def announcement_detail(request, society_id, announcement_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()
    announcement = get_society_object_or_none(SocietyAnnouncement, society, announcement_id)
    if not announcement:
        return Response({'error': 'Announcement not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(SocietyAnnouncementSerialiser(announcement).data)
    permission_response = _society_admin_error(request.user, society)
    if permission_response:
        return permission_response
    silent = is_silent_request(request)
    if request.method == 'DELETE':
        return delete_announcement(announcement, silent)
    return update_announcement(announcement, request.data, silent)


def _society_admin_error(user, society):
    if is_society_admin(user, society):
        return None
    return permission_denied_response()

def update_announcement(announcement, data, silent=False):
    payload, errors, status_code = update_announcement_result(announcement, data, silent)
    if errors:
        return Response(errors, status=status_code)
    return Response(payload)


def update_announcement_result(announcement, data, silent=False):
    context = {'skip_notification': silent}
    serialiser = SocietyAnnouncementSerialiser(announcement, data=data, partial=True, context=context)
    if not serialiser.is_valid():
        return None, serialiser.errors, status.HTTP_400_BAD_REQUEST
    serialiser.save()
    image_urls = get_image_urls(data)
    if 'images' in data or 'image_urls' in data:
        update_announcement_images(announcement, image_urls)
    announcement.refresh_from_db()
    return SocietyAnnouncementSerialiser(announcement).data, None, status.HTTP_200_OK

def update_announcement_images(announcement, image_urls):
    announcement.images.all().delete()
    save_announcement_images(announcement, image_urls)

def delete_announcement(announcement, silent=False):
    if silent:
        announcement._skip_notification = True
    announcement.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
