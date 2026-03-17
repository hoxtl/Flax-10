"""
Views for retrieving, updating, and deleting individual calendar events.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from studyFlax.serialisers.calendar.event_serialisers import (
    CalendarEventSerialiser,
    CalendarEventCreateSerialiser
)
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from .event_helpers import exceeds_overlap_limit

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def event_detail(request, pk):
    event = get_object_or_404(CalendarEvent, pk=pk, user=request.user)

    if request.method == 'GET': 
        return get_event(event)
    if request.method == 'PUT': 
        return update_event(event, request.data)
    return delete_event(event)

def get_event(event):
    serialiser = CalendarEventSerialiser(event)
    return Response(serialiser.data)

def _is_locked_event(event):
    source = (event.source or '').lower()
    if source == 'society':
        return True
    if source.startswith('module_'):
        return True
    return event.title.lower().startswith('lecture:')

def _locked_event_response():
    return Response(
        {'error': 'Lecture and society events are read-only.'},
        status=status.HTTP_403_FORBIDDEN,
    )

def _pick_time(event, data, field):
    return data.get(field, getattr(event, field))

def _overlap_limit_response():
    return Response(
        {'error': 'Cannot have more than 3 overlapping events.'},
        status=status.HTTP_400_BAD_REQUEST,
    )

def update_event(event, data):
    if _is_locked_event(event):
        return _locked_event_response()
    start_time = _pick_time(event, data, 'start_time')
    end_time = _pick_time(event, data, 'end_time')
    if exceeds_overlap_limit(event.user, start_time, end_time, exclude_id=event.id):
        return _overlap_limit_response()
    serialiser = CalendarEventCreateSerialiser(event, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(CalendarEventSerialiser(event).data)

def delete_event(event):
    if _is_locked_event(event):
        return _locked_event_response()
    event.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_exception_date(request, pk):
    event = get_object_or_404(CalendarEvent, pk=pk, user=request.user)
    date = request.data.get('date')
    if not date:
        return Response({'error': 'date is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not event.recurrence_rule:
        return Response({'error': 'Event has no recurrence rule'}, status=status.HTTP_400_BAD_REQUEST)
    exception_dates = event.recurrence_rule.exception_dates or []
    if date not in exception_dates:
        exception_dates.append(date)
        event.recurrence_rule.exception_dates = exception_dates
        event.recurrence_rule.save()
    return Response(CalendarEventSerialiser(event).data)
