"""
View for retrieving and updating a user's home address.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ValidationError

def _get_home_address_data(user):
    """Return the user's current home address as a dict."""

    return {
        "home_address": user.home_address or "",
        "home_latitude": user.home_latitude,
        "home_longitude": user.home_longitude,
    }

def _save_home_address(user, data):
    """Update the user's home address fields from the given data dict."""

    user.home_address = data.get("home_address", "")
    user.home_latitude = _to_float(data.get("home_latitude"), "home_latitude")
    user.home_longitude = _to_float(data.get("home_longitude"), "home_longitude")
    user.save()

def _to_float(value, field_name):
    """Convert input to float if present, else raise ValidationError."""

    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError({field_name: f"{field_name} must be a valid number."}) from exc


def _home_address_success_response(user):
    return Response({"success": True, "home_address": user.home_address})


def _home_address_error_response(exc):
    return Response({"success": False, "error": exc.message_dict}, status=status.HTTP_400_BAD_REQUEST)


def _update_home_address(user, data):
    try:
        _save_home_address(user, data)
        return _home_address_success_response(user)
    except ValidationError as exc:
        return _home_address_error_response(exc)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def home_address_view(request):
    """Retrieve or update the authenticated user's home address."""

    if request.method == "GET":
        return Response(_get_home_address_data(request.user))
    return _update_home_address(request.user, request.data)
