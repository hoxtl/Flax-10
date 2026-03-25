"""
Shared serialiser utilities used across multiple serialiser modules.
"""

from rest_framework import serializers


def build_profile_photo_url(photo, request):
    """Return the absolute URL for a profile photo, or None."""

    if not photo:
        return None
    absolute_url = _photo_string_url(photo)
    if absolute_url:
        return absolute_url
    url = _safe_photo_url(photo)
    if not url:
        return None
    return _request_photo_url(request, url)


def _photo_string_url(photo):
    photo_str = str(photo).strip()
    if photo_str.startswith(("http://", "https://")):
        return photo_str
    return None


def _safe_photo_url(photo):
    try:
        return photo.url
    except (ValueError, AttributeError):
        return None


def _request_photo_url(request, url):
    if not request:
        return None
    return request.build_absolute_uri(url)

def ensure_teacher_user(request, error_message: str) -> None:
    """Ensure the request user is a teacher, otherwise raise a ValidationError."""

    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_teacher", None) or not user.is_teacher():
        raise serializers.ValidationError(error_message)

def format_teacher_name(user) -> str:
    """Return a display name for a user, prefixing Dr. for teachers when appropriate."""

    if not user:
        return "Unknown"
    name = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
    if getattr(user, "role", None) == "teacher":
        return format_teacher_display_name(name)
    return name or "Unknown"


def format_teacher_display_name(name: str) -> str:
    """Return a teacher display name with a Dr. prefix when one is missing."""

    clean = str(name or "").strip()
    if not clean:
        return "Unknown"
    if clean.startswith("Dr."):
        return clean
    return f"Dr. {clean}"


def is_shared_with_requester(owner, request):
    """Return true if owner has explicitly shared with the requesting user."""

    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return False
    return owner.sharing_with.filter(shared_with=user).exists()


def is_user_sharing_with(owner, request, *, allow_self=False):
    """Return true if request.user is sharing their calendar with owner."""

    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if allow_self and user == owner:
        return True
    return user.sharing_with.filter(shared_with=owner).exists()


def can_view_user_stats(request, user_obj):
    """Return true when a user can access another user's study visibility fields."""

    request_user = getattr(request, "user", None)
    is_owner = request_user and request_user.is_authenticated and request_user == user_obj
    return bool(is_owner or is_shared_with_requester(user_obj, request))
