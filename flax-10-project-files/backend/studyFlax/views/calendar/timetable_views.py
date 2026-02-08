from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .timetable_service import sync_timetable

@api_view(['POST'])
def timetable_import(request):
    source_url = (request.data.get("source_url") or "").strip()
    source_url = source_url.split()[0] if source_url else ""
    if not source_url:
        return Response({"detail": "source_url is required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        result = sync_timetable(source_url)
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(result)
