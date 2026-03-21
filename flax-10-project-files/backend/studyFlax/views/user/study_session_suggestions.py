"""
Helpers for profile study-session suggestions.
"""

from rest_framework import status
from rest_framework.response import Response

from studyFlax.models import User
from studyFlax.models.notifications.notification_model import Notification


def get_target_user(target_user_id):
    try:
        return User.objects.get(id=int(target_user_id))
    except (ValueError, TypeError, User.DoesNotExist):
        return None

<<<<<<< HEAD
=======

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def validate_target_user(target_user, request_user):
    if not target_user:
        return Response({'error': 'Target user not found'}, status=status.HTTP_404_NOT_FOUND)
    if target_user == request_user:
        return Response({'error': 'Cannot suggest a session to yourself'}, status=status.HTTP_400_BAD_REQUEST)
    return None

<<<<<<< HEAD
=======

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def build_suggestion_message(request_user, data):
    custom_message = (data.get('message') or '').strip()
    if custom_message:
        return custom_message
    slot_start = (data.get('slot_start') or '').strip()
    slot_end = (data.get('slot_end') or '').strip()
    if slot_start and slot_end:
        return f"{request_user.username} suggested a study session from {slot_start} to {slot_end}."
    return f"{request_user.username} suggested studying together this week."

<<<<<<< HEAD
=======

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def create_study_suggestion(target_user, request_user, data):
    Notification.objects.create(
        user=target_user,
        title=f"Study session suggestion from {request_user.username}",
        message=build_suggestion_message(request_user, data),
        notification_type='meeting_suggestion',
        action_url='calendar',
    )
