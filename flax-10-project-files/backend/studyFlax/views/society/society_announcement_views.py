from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.society import SocietyAnnouncement, SocietyAnnouncementImage
from studyFlax.serialisers import SocietyAnnouncementSerialiser
from .helpers import (
    get_society_or_404, is_society_admin,
    society_not_found_response, permission_denied_response
)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def announcement_list(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    if request.method == 'GET':
        return get_announcements(society)
    return create_announcement(request, society)


def get_announcements(society):
    announcements = SocietyAnnouncement.objects.filter(society=society)
    return Response(SocietyAnnouncementSerialiser(announcements, many=True).data)


def create_announcement(request, society):
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    serialiser = SocietyAnnouncementSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    announcement = serialiser.save(society=society)
    save_announcement_images(announcement, request.data.get('image_urls', []))
    return Response(SocietyAnnouncementSerialiser(announcement).data, status=status.HTTP_201_CREATED)


def save_announcement_images(announcement, image_urls):
    for i, url in enumerate(image_urls):
        SocietyAnnouncementImage.objects.create(announcement=announcement, url=url, order=i)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def announcement_detail(request, society_id, announcement_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    announcement = get_announcement_or_none(society, announcement_id)
    if not announcement:
        return Response({'error': 'Announcement not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(SocietyAnnouncementSerialiser(announcement).data)
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    if request.method == 'DELETE':
        return delete_announcement(announcement)
    return update_announcement(announcement, request.data)


def get_announcement_or_none(society, announcement_id):
    try:
        return SocietyAnnouncement.objects.get(society=society, pk=announcement_id)
    except SocietyAnnouncement.DoesNotExist:
        return None


def update_announcement(announcement, data):
    serialiser = SocietyAnnouncementSerialiser(announcement, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    if 'image_urls' in data:
        update_announcement_images(announcement, data['image_urls'])
    return Response(SocietyAnnouncementSerialiser(announcement).data)


def update_announcement_images(announcement, image_urls):
    announcement.images.all().delete()
    save_announcement_images(announcement, image_urls)


def delete_announcement(announcement):
    announcement.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
