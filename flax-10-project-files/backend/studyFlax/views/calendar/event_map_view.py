from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_events_map_view(request):
    """
    Retrieve calendar events with a valid location to display on the map for that day.
    """
    user = request.user
    now = timezone.now()
    start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_time = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    events = CalendarEvent.objects.filter(
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
    event_data = []
    for event in events:
        event_data.append({
            'id': event.id,
            'title': event.title,
            'location': event.location,
            'latitude': event.location_latitude,
            'longitude': event.location_longitude,
            'start_time': event.start_time.isoformat(),
            'end_time': event.end_time.isoformat(),
            'priority': event.priority,
        })
    
    return Response({'events': event_data})