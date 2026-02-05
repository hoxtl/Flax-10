from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models import CalendarEvent
from studyFlax.serialisers import CalendarEventSerialiser, CalendarEventCreateSerialiser
from .event_helpers import filter_events_by_date_range, check_event_overlap

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def event_list(request):
    if request.method == 'GET':
        return get_events(request)
    return create_event(request)

def get_events(request):
    events = CalendarEvent.objects.filter(user=request.user)
    events = filter_events_by_date_range(events, request.query_params)
    serialiser = CalendarEventSerialiser(events, many=True)
    return Response(serialiser.data)

def create_event(request):
    serialiser = CalendarEventCreateSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    overlap = check_event_overlap(request.user, serialiser.validated_data)
    event = serialiser.save(user=request.user)
    response_data = CalendarEventSerialiser(event).data
    response_data['has_overlap'] = overlap
    return Response(response_data, status=status.HTTP_201_CREATED)
    