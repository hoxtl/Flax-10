from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from studyFlax.models import CalendarEvent
from studyFlax.serialisers import CalendarEventSerialiser, CalendarEventCreateSerialiser

@api_view(['GET', 'PUT', 'DELETE'])
# TODO: Enable authentication when ready
# @permission_classes([IsAuthenticated])
def event_detail(request, pk):
    # TODO: Filter by user when authentication is enabled
    # event = get_object_or_404(CalendarEvent, pk=pk, user=request.user)
    event = get_object_or_404(CalendarEvent, pk=pk)

    if request.method == 'GET': 
        return get_event(event)
    if request.method == 'PUT': 
        return update_event(event, request.data)
    return delete_event(event)

def get_event(event):
    serialiser = CalendarEventSerialiser(event)
    return Response(serialiser.data)

def update_event(event, data):
    serialiser = CalendarEventCreateSerialiser(event, data=data, partial=True)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    
    serialiser.save()
    return Response(CalendarEventSerialiser(event).data)

def delete_event(event):
    event.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
def add_exception_date(request, pk):
    event = get_object_or_404(CalendarEvent, pk=pk)
    if not event.recurrence_rule:
        return Response({'error': 'Event is not recurring'}, status=status.HTTP_400_BAD_REQUEST)

    date_str = request.data.get('date')
    if not date_str:
        return Response({'error': 'Date is required'}, status=status.HTTP_400_BAD_REQUEST)

    rule = event.recurrence_rule
    exceptions = rule.exception_dates or []
    if date_str not in exceptions:
        exceptions.append(date_str)
        rule.exception_dates = exceptions
        rule.save()

    return Response({'success': True, 'exception_dates': rule.exception_dates})