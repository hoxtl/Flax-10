"""
Views for society event listing, creation, update, and deletion.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.society import SocietyEvent
from studyFlax.serialisers import SocietyEventSerialiser
from .helpers import (
    get_society_or_404,
    get_society_object_or_none,
    is_society_admin,
    is_silent_request,
    society_not_found_response,
    permission_denied_response,
)

<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def event_list(request, society_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    if request.method == 'GET':
        return get_events(society)
    return create_event(request, society)

def get_events(society):
    events = SocietyEvent.objects.filter(society=society)
<<<<<<< HEAD

    return Response(SocietyEventSerialiser(events, many=True).data)

def create_event(request, society):
    payload, errors, status_code = create_event_result(request.user, request.data, society, is_silent_request(request))
    if errors:

        return Response(errors, status=status_code)
    return Response(payload, status=status_code)

def create_event_result(user, data, society, silent):
    permission_response = _event_admin_error(user, society)
    if permission_response:
        return None, permission_response.data, permission_response.status_code
    serialiser = SocietyEventSerialiser(data=data, context={'skip_notification': silent})
    if not serialiser.is_valid():

        return None, serialiser.errors, status.HTTP_400_BAD_REQUEST
    serialiser.save(society=society)

    return serialiser.data, None, status.HTTP_201_CREATED

def _event_not_found_response():
    return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

def _event_detail_get_response(event):
    return Response(SocietyEventSerialiser(event).data)

def _event_detail_write_response(request, society, event):
    permission_response = _event_admin_error(request.user, society)
    if permission_response:

        return permission_response
    silent = is_silent_request(request)
    if request.method == 'DELETE':
        return delete_event(event, silent)
    return update_event(event, request.data, silent)

@api_view(['GET', 'PATCH', 'DELETE'])

=======
    return Response(SocietyEventSerialiser(events, many=True).data)

def create_event(request, society):
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    silent = is_silent_request(request)
    context = {'skip_notification': silent}
    serialiser = SocietyEventSerialiser(data=request.data, context=context)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save(society=society)
    return Response(serialiser.data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PATCH', 'DELETE'])
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
@permission_classes([IsAuthenticated])
def event_detail(request, society_id, event_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()
<<<<<<< HEAD
    return _event_detail_response(request, society, event_id)

def _event_detail_response(request, society, event_id):
    event = get_society_object_or_none(SocietyEvent, society, event_id)
    if not event:
        return _event_not_found_response()
    if request.method == 'GET':

        return _event_detail_get_response(event)
    return _event_detail_write_response(request, society, event)

def _event_admin_error(user, society):
    if is_society_admin(user, society):

        return None
    return permission_denied_response()

def update_event(event, data, silent=False):
    payload, errors, status_code = update_event_result(event, data, silent)
    if errors:

        return Response(errors, status=status_code)
    return Response(payload)

def update_event_result(event, data, silent=False):
    serialiser = SocietyEventSerialiser(event, data=data, partial=True, context={'skip_notification': silent})

    if not serialiser.is_valid():
        return None, serialiser.errors, status.HTTP_400_BAD_REQUEST
    serialiser.save()
    return serialiser.data, None, status.HTTP_200_OK
=======
    event = get_society_object_or_none(SocietyEvent, society, event_id)
    if not event:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(SocietyEventSerialiser(event).data)
    if not is_society_admin(request.user, society):
        return permission_denied_response()
    silent = is_silent_request(request)
    if request.method == 'DELETE':
        return delete_event(event, silent)
    return update_event(event, request.data, silent)

def update_event(event, data, silent=False):
    context = {'skip_notification': silent}
    serialiser = SocietyEventSerialiser(event, data=data, partial=True, context=context)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

def delete_event(event, silent=False):
    if silent:
        event._skip_notification = True
    event.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

def _add_exception_date(event, date):
    if date not in event.exception_dates:
        event.exception_dates.append(date)
        event.save()
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        notify_exception(event, date)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_society_event_exception(request, society_id, event_id):
<<<<<<< HEAD
    return _society_event_exception_response(request, society_id, event_id)

def _society_event_exception_response(request, society_id, event_id):
    society = get_society_or_404(society_id)
    if not society:
        return society_not_found_response()

    return _event_exception_response(request, society, event_id)

def _event_exception_response(request, society, event_id):
    event = get_society_object_or_none(SocietyEvent, society, event_id)
    if not event:
        return _event_not_found_response()

    permission_response = _event_admin_error(request.user, society)
    if permission_response:
        return permission_response
    date = _event_exception_date(request)
    if isinstance(date, Response):

        return date
    return _event_exception_result(event, date)

def _event_exception_result(event, date):

    recurrence_error = _event_recurrence_error(event)
    if recurrence_error:
        return recurrence_error
    _add_exception_date(event, date)
    return Response(SocietyEventSerialiser(event).data)

def _event_exception_date(request):
    date = request.data.get('date')
    if date:
        return date
    return Response({'error': 'date is required'}, status=status.HTTP_400_BAD_REQUEST)

def _event_recurrence_error(event):
    if event.recurrence == 'none':
        return Response({'error': 'Event has no recurrence'}, status=status.HTTP_400_BAD_REQUEST)
    return None
=======
    society = get_society_or_404(society_id)
    if not society: return society_not_found_response()
    event = get_society_object_or_none(SocietyEvent, society, event_id)
    if not event: return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    if not is_society_admin(request.user, society): return permission_denied_response()
    date = request.data.get('date')
    if not date: return Response({'error': 'date is required'}, status=status.HTTP_400_BAD_REQUEST)
    if event.recurrence == 'none':
        return Response({'error': 'Event has no recurrence'}, status=status.HTTP_400_BAD_REQUEST)
    _add_exception_date(event, date)
    return Response(SocietyEventSerialiser(event).data)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

def notify_exception(event, date):
    from studyFlax.signals.society_notifications import notify_society_members
    notify_society_members(event.society, {
        'title': f"Event occurrence cancelled in {event.society.name}",
        'message': f'"{event.title}" on {date} has been removed from the calendar.',
        'notification_type': 'society_event',
        'society_id': event.society_id,
    })
