from rest_framework import serializers

def ensure_teacher_user(request, error_message: str) -> None:
    """
    Ensure the request user is a teacher, otherwise raise a ValidationError.
    """
    user = getattr(request, "user", None)
    if not user or not getattr(user, "is_teacher", None) or not user.is_teacher():
        raise serializers.ValidationError(error_message)

def format_teacher_name(user) -> str:
    """
    Return a display name for a user, prefixing Dr. for teachers when appropriate.
    """
    if not user:
        return "Unknown"
    name = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
    if getattr(user, "role", None) == "teacher" and not name.startswith("Dr."):
        return f"Dr. {name}"
    return name or "Unknown"

