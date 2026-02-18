from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.serialisers.event_serialisers import (
    CalendarEventSerialiser,
    CalendarEventCreateSerialiser
)
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from .event_helpers import (
    check_event_overlap,
    filter_events_by_date_range,
    parse_date_param,
    expand_recurring_events
)
from .timetable_service import sync_timetable_if_needed
from .society_sync_service import get_synced_society_events


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def event_list(request):
    if request.method == 'GET':
        return get_events(request)
    return create_event(request)


def get_events(request):
    safe_sync_timetable(request.user)
    start = parse_date_param(request.query_params.get('start'))
    end = parse_date_param(request.query_params.get('end'))
    personal = get_personal_events(request.user, request.query_params, start, end)
    society = get_synced_society_events(request.user, start, end)
    return Response(personal + society)


def get_personal_events(user, query_params, start, end):
    base_events = CalendarEvent.objects.filter(user=user)
    filtered = filter_events_by_date_range(base_events, query_params)
    expanded = expand_recurring_events(filtered, start, end)
    return CalendarEventSerialiser(expanded, many=True).data


def safe_sync_timetable(user):
    try:
        sync_timetable_if_needed(user)
    except Exception:
        pass


def create_event(request):
    serialiser = CalendarEventCreateSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    overlap = check_event_overlap(request.user, serialiser.validated_data)
    event = serialiser.save(user=request.user)
    response_data = CalendarEventSerialiser(event).data
    response_data['has_overlap'] = overlap
    return Response(response_data, status=status.HTTP_201_CREATED)
