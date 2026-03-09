from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from datetime import datetime, timedelta

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_events_map_view(request):