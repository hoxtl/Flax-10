from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models import CalendarEvent
from studyFlax.serialisers import CalendarEventSerialiser, CalendarEventCreateSerialiser
from .event_helpers import filter_events_by_date_range, check_event_overlap, expand_recurring_events, parse_date_param

@api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated]) # Uncomment when we have user authentication
def event_list(request):
    if request.method == 'GET':
        return get_events(request)
    return create_event(request)

def get_events(request):
    events = CalendarEvent.objects.all()
    events = filter_events_by_date_range(events, request.query_params)
    start_date = parse_date_param(request.query_params.get('start'))
    end_date = parse_date_param(request.query_params.get('end'))
    expanded_events = expand_recurring_events(list(events), start_date, end_date)
    serialiser = CalendarEventSerialiser(expanded_events, many=True)
    return Response(serialiser.data)

def create_event(request):
    serialiser = CalendarEventCreateSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # overlap = check_event_overlap(request.user, serialiser.validated_data) # Uncomment when we have user authentication
    # event = serialiser.save(user=request.user) # Uncomment when we have user authentication
    event = serialiser.save() # Remove when we have user authentication
    response_data = CalendarEventSerialiser(event).data
    # response_data['has_overlap'] = overlap # Uncomment when we have user authentication
    return Response(response_data, status=status.HTTP_201_CREATED)
    