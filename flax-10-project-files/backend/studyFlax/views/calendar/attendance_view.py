"""Attendance API views. Single responsibility: HTTP request/response only."""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import DatabaseError

from studyFlax.models import EventAttendance

from .attendance_helpers import get_event_for_attendance, build_attendance_stats

def _internal_error(detail):
    """Return a standard internal-server-response payload."""
    return Response({"detail": detail}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _safe_attendance_stats_response(request):
    """Fetch stats and return Response; on failure return 500 with detail."""
    try:
        records = (
            EventAttendance.objects.filter(user=request.user)
            .select_related("event", "event__tag")
            .only("attended", "event__id", "event__tag__name")
        )
        return Response(build_attendance_stats(records))
    except DatabaseError:
        detail = "Attendance data is unavailable. Run migrations: python manage.py migrate"
        return _internal_error(detail)

def _attendance_response(obj, event, created):
    return Response({
        "id": obj.id, "event_id": event.id,
        "attended": obj.attended, "recorded_at": obj.recorded_at,
        "created": created,
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def record_attendance(request):
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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_records(request):
    """Return list of { event_id, attended } for the current user."""
    try:
        records = (
            EventAttendance.objects.filter(user=request.user)
            .values_list("event_id", "attended")
        )
        data = [{"event_id": eid, "attended": att} for eid, att in records]
        return Response(data)
    except DatabaseError:
        return _internal_error("Attendance records unavailable.")
