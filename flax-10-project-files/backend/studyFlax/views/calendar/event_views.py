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


from studyFlax.models import User

def get_events(request):
    requested_user_id = request.query_params.get('user_id')
    
    if requested_user_id:
        try:
            target_user = User.objects.get(id=requested_user_id)
        except User.DoesNotExist:
            return Response([])
            
        # Check if target_user has shared their calendar with request.user
        if target_user != request.user:
            from studyFlax.models.social.shareModel import CalendarShare
            is_shared_with_me = CalendarShare.objects.filter(owner=target_user, shared_with=request.user).exists()
            if not is_shared_with_me:
                return Response([]) # Gracefully deny access
    else:
        target_user = request.user
        safe_sync_timetable(target_user) # Only sync if it's the current user

    start = parse_date_param(request.query_params.get('start'))
    end = parse_date_param(request.query_params.get('end'))
    
    personal = get_personal_events(target_user, request.query_params, start, end, is_viewer=target_user != request.user)
    society = get_synced_society_events(target_user, start, end)
    
    return Response(personal + society)


def get_personal_events(user, query_params, start, end, is_viewer=False):
    base_events = CalendarEvent.objects.filter(user=user)
    filtered = filter_events_by_date_range(base_events, query_params)
    expanded = expand_recurring_events(filtered, start, end)
    events_data = CalendarEventSerialiser(expanded, many=True).data
    if is_viewer:
        events_data = [mask_private_event(e) if e.get('is_private') else e for e in events_data]
    return events_data


def mask_private_event(event):
    return {
        **event,
        'title': 'Busy',
        'description': '',
        'location': None,
        'tag': None,
        'tag_name': None,
        'tag_details': None,
    }


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
