<<<<<<< HEAD
"""
View for calendar event map data.
"""

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from django.utils import timezone


def _day_window(now):
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    return start, end

<<<<<<< HEAD
=======

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def _map_events_queryset(user, now, start_time, end_time):
    return CalendarEvent.objects.filter(
        user=user,
        location_validated=True,
        location_latitude__isnull=False,
        location_longitude__isnull=False,
        start_time__gte=start_time,
        start_time__lte=end_time,
        end_time__gte=now,
    ).only(
        'id', 'title', 'location',
        'location_latitude', 'location_longitude',
        'start_time', 'end_time', 'priority'
    ).order_by('start_time')

<<<<<<< HEAD
=======

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def _serialise_map_event(event):
    return {
        'id': event.id,
        'title': event.title,
        'location': event.location,
        'latitude': event.location_latitude,
        'longitude': event.location_longitude,
        'start_time': event.start_time.isoformat(),
        'end_time': event.end_time.isoformat(),
        'priority': event.priority,
    }

<<<<<<< HEAD
def _serialise_map_events(events):
    return [_serialise_map_event(event) for event in events]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_events_map_view(request):
    """Retrieve calendar events with a valid location to display on the map for that day."""
=======

def _serialise_map_events(events):
    return [_serialise_map_event(event) for event in events]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_events_map_view(request):
    """
    Retrieve calendar events with a valid location to display on the map for that day.
    """
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    now = timezone.now()
    start_time, end_time = _day_window(now)
    events = _map_events_queryset(request.user, now, start_time, end_time)
    return Response({'events': _serialise_map_events(events)})
