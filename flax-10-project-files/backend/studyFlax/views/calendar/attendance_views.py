"""Attendance API views. Single responsibility: HTTP request/response only."""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models import EventAttendance

from .attendance_helpers import get_event_for_attendance, build_attendance_stats


def _safe_attendance_stats_response(request):
    """Fetch stats and return Response; on failure return 500 with detail."""
    try:
        records = (
            EventAttendance.objects.filter(user=request.user)
            .select_related("event", "event__tag")
            .only("attended", "event__id", "event__tag__name")
        )
        return Response(build_attendance_stats(records))
    except Exception as e:
        detail = "Attendance data is unavailable. Run migrations: python manage.py migrate"
        return Response({"detail": detail}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def record_attendance(request):
    """Record or update attendance for a timetable event. Body: { event_id, attended }."""
    event_id = request.data.get("event_id")
    attended = request.data.get("attended", True)
    event, error = get_event_for_attendance(request.user, event_id)
    if error is not None:
        return error
    obj, created = EventAttendance.objects.update_or_create(
        user=request.user,
        event=event,
        defaults={"attended": bool(attended)},
    )
    return Response({
        "id": obj.id,
        "event_id": event.id,
        "attended": obj.attended,
        "recorded_at": obj.recorded_at,
        "created": created,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_stats(request):
    """Return attendance stats for the current user: overall and by event type."""
    return _safe_attendance_stats_response(request)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_records(request):
    """Return list of attendance records with full event details for the current user."""
    try:
        from .attendance_helpers import _event_type_from_record
        records = (
            EventAttendance.objects.filter(user=request.user)
            .select_related("event", "event__tag")
            .only("event_id", "attended", "event__title", "event__start_time", "event__description", "event__tag__name")
            .order_by("-event__start_time")
        )
        data = [
            {
                "event_id": r.event_id,
                "attended": r.attended,
                "title": r.event.title,
                "start_time": r.event.start_time,
                "description": r.event.description,
                "event_type": _event_type_from_record(r),
            }
            for r in records
        ]
        return Response(data)
    except Exception:
        return Response(
            {"detail": "Attendance records unavailable."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
