from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import json


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def home_address_view(request):
    """
    Method to retrieve/save user's home address with coordinates
    """
    if request.method == "GET":
        user = request.user
        return Response({
            "home_address": user.home_address or "",
            "home_latitude": user.home_latitude,
            "home_longitude": user.home_longitude,
        })
    elif request.method == "POST":
        try:
            data = request.data
            user = request.user

            user.home_address = data.get("home_address", "")
            user.home_latitude = data.get("home_latitude")
            user.home_longitude = data.get("home_longitude")
            user.save()

            return Response({
                "success": True,
                "home_address": user.home_address,
            })
        except Exception as e:  # pragma: no cover
            return Response({"success": False, "error": str(e)}, status=400)