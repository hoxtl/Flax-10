from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from datetime import datetime, timedelta

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_events_map_view(request):
    """
    Retrieve calendar events with a valid location to display on the map
    """
    user = request.user
    today = datetime.now()
    future_date = today + timedelta(days=30)
    events = CalendarEvent.objects.filter(
        user=user,
        location_validated=True,
        location_latitude___isnull=False,
        location_longitude__isnull=False,
        start_time__gte=today,
        start_time__lte=future_date,
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