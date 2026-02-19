from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.society import SocietyEvent
from studyFlax.serialisers import SocietyEventSerialiser
from .helpers import (
    get_society_or_404, is_society_admin,
    society_not_found_response, permission_denied_response
)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def event_list(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    if request.method == 'GET':
        return get_events(society)
    return create_event(request, society)


def get_events(society):
    events = SocietyEvent.objects.filter(society=society)
    return Response(SocietyEventSerialiser(events, many=True).data)


def create_event(request, society):
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    serialiser = SocietyEventSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save(society=society)
    return Response(serialiser.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def event_detail(request, society_id, event_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    event = get_event_or_none(society, event_id)
    if not event:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(SocietyEventSerialiser(event).data)
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    if request.method == 'DELETE':
        return delete_event(event)
    return update_event(event, request.data)


def get_event_or_none(society, event_id):
    try:
        return SocietyEvent.objects.get(society=society, pk=event_id)
    except SocietyEvent.DoesNotExist:
        return None


def update_event(event, data):
    serialiser = SocietyEventSerialiser(event, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data)


def delete_event(event):
    event.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
