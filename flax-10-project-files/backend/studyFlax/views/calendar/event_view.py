"""
Views for calendar event listing and creation.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.serialisers.calendar.event_serialisers import (
    CalendarEventSerialiser,
    CalendarEventCreateSerialiser
)
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models import User
from .event_helpers import (
    check_event_overlap,
    exceeds_overlap_limit,
    filter_events_by_date_range,
    parse_date_param,
    expand_recurring_events
)
from .timetable_service import sync_timetable_if_needed, TimetableSyncError
from .society_sync_service import get_synced_society_events
import logging
import sys

logger = logging.getLogger(__name__)

def _is_running_tests():
    return "test" in sys.argv

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def event_list(request):
    if request.method == 'GET':
        return get_events(request)
    return create_event(request)

def _calendar_is_shared(owner, viewer):
    from studyFlax.models.social.shareModel import CalendarShare
    return CalendarShare.objects.filter(owner=owner, shared_with=viewer).exists()

def _log_timetable_sync_error(exc):
    if _is_running_tests():
        return
    logger.debug("Timetable sync skipped: %s", str(exc))

def _resolve_target_user(request):
    user_id = request.query_params.get('user_id')
    if not user_id:
        safe_sync_timetable(request.user)
        return request.user
    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None
    if target != request.user and not _calendar_is_shared(target, request.user):
        return None
    return target

def get_events(request):
    target_user = _resolve_target_user(request)
    if target_user is None:
        return Response([])
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
    except Exception as exc:
        _log_timetable_sync_error(exc)

def create_event(request):
    serialiser = CalendarEventCreateSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    data = serialiser.validated_data
    if exceeds_overlap_limit(request.user, data['start_time'], data['end_time']):
        return Response({'error': 'Cannot have more than 3 overlapping events.'}, status=status.HTTP_400_BAD_REQUEST)
    overlap = check_event_overlap(request.user, data)
    event = serialiser.save(user=request.user)
    response_data = CalendarEventSerialiser(event).data
    response_data['has_overlap'] = overlap
    return Response(response_data, status=status.HTTP_201_CREATED)
