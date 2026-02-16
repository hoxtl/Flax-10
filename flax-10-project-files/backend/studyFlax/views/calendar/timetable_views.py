from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .timetable_service import sync_timetable


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def timetable_import(request):
    source_url = (request.data.get("source_url") or "").strip()
    source_url = source_url.split()[0] if source_url else ""
    
    if not source_url:
        return Response({"detail": "source_url is required"}, status=status.HTTP_400_BAD_REQUEST)
    
<<<<<<< HEAD
    if not source_url.startswith(('http://', 'https://')):
        return Response({"detail": "Invalid URL protocol. Must start with http:// or https://"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        result = sync_timetable(source_url, request.user)
=======
    try:
        # Pass user to sync_timetable
        result = sync_timetable(source_url, user=request.user)
>>>>>>> main
    except ValueError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(result)
