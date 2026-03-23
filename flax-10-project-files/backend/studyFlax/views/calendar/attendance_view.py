"""
Attendance API views.

Handles recording attendance for timetable events and retrieving
attendance statistics and records for the authenticated user.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import DatabaseError

from studyFlax.models import EventAttendance

from .attendance_helpers import get_event_for_attendance, build_attendance_stats, _event_type_from_record


def _internal_error(detail):
    """Return a standard 500 response payload."""

    return Response({"detail": detail}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _safe_attendance_stats_response(request):
    """Fetch stats and return a Response; return 500 on database failure."""

    try:
        records = (
            EventAttendance.objects.filter(user=request.user)
            .select_related("event", "event__tag")
            .only("attended", "event__id", "event__tag__name")
        )
        return Response(build_attendance_stats(records))
    except DatabaseError:
        return _internal_error("Attendance data is unavailable. Run migrations: python manage.py migrate")

def _attendance_response(obj, event, created):
    return Response({
        "id": obj.id, "event_id": event.id,
        "attended": obj.attended, "recorded_at": obj.recorded_at,
        "created": created,
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def record_attendance(request):
    """Record or update attendance for a single timetable event."""

    event_id = request.data.get("event_id")
    attended = request.data.get("attended", True)
    event, error = get_event_for_attendance(request.user, event_id)
    if error is not None:
        return error
    obj, created = EventAttendance.objects.update_or_create(
        user=request.user, event=event,
        defaults={"attended": bool(attended)},
    )
    return _attendance_response(obj, event, created)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_stats(request):
    """Return attendance stats for the current user: overall and by event type."""

    return _safe_attendance_stats_response(request)

def _attendance_records_queryset(user):
    return (
        EventAttendance.objects.filter(user=user)
        .select_related("event", "event__tag")
        .only("event_id", "attended", "event__title", "event__start_time", "event__description", "event__tag__name")
        .order_by("-event__start_time")
    )

def _serialise_record(record):
    return {
        "event_id": record.event_id,
        "attended": record.attended,
        "title": record.event.title,
        "start_time": record.event.start_time,
        "description": record.event.description,
        "event_type": _event_type_from_record(record),
    }

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_records(request):
    """Return attendance records with full event details for the current user."""

    try:
        records = _attendance_records_queryset(request.user)
        return Response([_serialise_record(r) for r in records])
    except DatabaseError:
        return _internal_error("Attendance records unavailable.")
