from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models import Event
from studyFlax.serialisers import EventSerialiser, EventCreateSerialiser
from .event_helpers import filter_events_by_date_range, check_event_overlap

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def event_list(request):
    if request.method == 'GET':
        return get_events(request)
    return create_event(request)

def get_events(request):
    events = Event.objects.filter(user=request.user)
    events = filter_events_by_date_range(events, request.query_params)
    serializer = EventSerialiser(events, many=True)
    return Response(serializer.data)

def create_event(request):
    serializer = EventCreateSerialiser(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    overlap = check_event_overlap(request.user, serializer.validated_data)
    event = serializer.save(user=request.user)
    response_data = EventSerialiser(event).data
    response_data['has_overlap'] = overlap
    return Response(response_data, status=status.HTTP_201_CREATED)
    