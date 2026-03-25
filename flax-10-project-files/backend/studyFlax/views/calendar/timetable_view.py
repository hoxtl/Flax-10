"""
Views for importing a user's timetable from an external URL.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .timetable_service import sync_timetable, TimetableSyncError

def validate_source_url(raw):
    url = (raw or "").strip().split()[0] if raw else ""
    if not url:
        return None, Response({"detail": "source_url is required"}, status=status.HTTP_400_BAD_REQUEST)
    if not url.startswith(('http://', 'https://')):
        return None, Response({"detail": "Invalid URL protocol. Must start with http:// or https://"}, status=status.HTTP_400_BAD_REQUEST)
    return url, None


def _timetable_import_success(url, user):
    return Response(sync_timetable(url, user))


def _timetable_import_error(exc):
    return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


def _timetable_import_unavailable():
    return Response({"detail": "Unable to sync timetable right now."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def timetable_import(request):
    url, error = validate_source_url(request.data.get("source_url"))
    if error:
        return error
    return _timetable_import_result(url, request.user)


def _timetable_import_result(url, user):
    try:
        return _timetable_import_success(url, user)
    except ValueError as exc:
        return _timetable_import_error(exc)
    except TimetableSyncError:
        return _timetable_import_unavailable()
