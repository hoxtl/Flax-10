from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.serialisers.event_serialisers import (
    CalendarEventSerialiser,
    CalendarEventCreateSerialiser
)
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from .event_helpers import check_event_overlap, filter_events_by_date_range, parse_date_param
from .timetable_service import sync_timetable_if_needed


def safe_sync_timetable():
    """Safely attempt timetable sync, ignoring errors"""
    try:
        sync_timetable_if_needed()
    except Exception:
        pass


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def event_list(request):
    if request.method == 'GET':
        return get_events(request)
    return create_event(request)


def get_events(request):
<<<<<<< HEAD
    safe_sync_timetable(request.user)
=======
    safe_sync_timetable()
    
    # ALWAYS filter by current user
>>>>>>> main
    events = CalendarEvent.objects.filter(user=request.user)
    events = filter_events_by_date_range(events, request.query_params)
    serialiser = CalendarEventSerialiser(events, many=True)
    return Response(serialiser.data)

<<<<<<< HEAD
def safe_sync_timetable(user):
    try:
        sync_timetable_if_needed(user)
    except Exception:
        pass
=======
>>>>>>> main

def create_event(request):
    serialiser = CalendarEventCreateSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    
<<<<<<< HEAD
    overlap = check_event_overlap(request.user, serialiser.validated_data)
    event = serialiser.save(user=request.user)
    response_data = CalendarEventSerialiser(event).data
    response_data['has_overlap'] = overlap
=======
    # ALWAYS assign to current user
    event = serialiser.save(user=request.user)
    response_data = CalendarEventSerialiser(event).data
>>>>>>> main
    return Response(response_data, status=status.HTTP_201_CREATED)
