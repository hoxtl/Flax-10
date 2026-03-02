from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import json


@require_http_methods(["GET", "POST"])
def home_address_view(request):
    """
    Method to retrieve/save user's home address with coordinates
    """
    if request.method == "GET":
        user = request.user
        return JsonResponse({
            "home_address": user.home_address or "",
            "home_latitude": user.home_latitude,
            "home_longitude": user.home_longitude,
        })
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            user = request.user

            user.home_address = data.get("home_address", "")
            user.home_latitude = data.get("home_latitude")
            user.home_longitude = data.get("home_longitude")
            user.save()

            return JsonResponse({
                "success": True,
                "home_address": user.home_address,
            })
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)