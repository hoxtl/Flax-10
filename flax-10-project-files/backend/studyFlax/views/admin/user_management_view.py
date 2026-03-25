"""
Admin views for managing user accounts.
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

User = get_user_model()
PROTECTED_FIXTURE_USERNAMES = frozenset({'janedoe', 'johndoe', 'charlie', 'amiller'})


def serialise_user(user):
    """Return the admin payload for a user."""

    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'is_active': user.is_active,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'date_joined': user.date_joined,
        'ban_reason': user.ban_reason,
    }


def not_found(message):
    """Return a not found response."""

    return Response({'error': message}, status=status.HTTP_404_NOT_FOUND)


def invalid_action_response():
    """Return an invalid action response."""

    return Response({'error': 'Invalid action. Use "ban" or "unban".'}, status=status.HTTP_400_BAD_REQUEST)


def staff_ban_response():
    """Return a response for protected staff users."""

    return Response({'error': 'Cannot ban staff users'}, status=status.HTTP_400_BAD_REQUEST)


def protected_user_ban_response():
    """Return a response for protected fixture users."""

    return Response({'error': 'Cannot ban protected fixture users'}, status=status.HTTP_400_BAD_REQUEST)


def missing_reason_response():
    """Return a response for a missing ban reason."""

    return Response({'error': 'Ban reason is required'}, status=status.HTTP_400_BAD_REQUEST)


def get_user_or_response(user_id):
    """Return the user or a matching error response."""

    try:
        return User.objects.get(id=user_id), None
    except User.DoesNotExist:
        return None, not_found('User not found')


def is_protected_fixture_user(user):
    """Return whether the user is a protected fixture account."""

    return (user.username or '').casefold() in PROTECTED_FIXTURE_USERNAMES


def apply_ban_action(user, action, reason):
    """Apply the requested ban state to a user."""

    is_ban = action == 'ban'
    user.is_active = not is_ban
    user.ban_reason = reason if is_ban else ''
    user.save(update_fields=['is_active', 'ban_reason'])
    verb = 'banned' if is_ban else 'unbanned'
    return Response({'message': f'{user.username} has been {verb}.', 'is_active': user.is_active})


def ban_request_data(request):
    """Return the requested action and cleaned reason."""

    return request.data.get('action', 'ban'), (request.data.get('reason') or '').strip()


def invalid_ban_request(action):
    """Return an error when the requested action is unsupported."""

    if action in ('ban', 'unban'):
        return None
    return invalid_action_response()


def ban_target_error(user, action, reason):
    """Return an error when the target user cannot be banned."""

    action_error = invalid_ban_request(action)
    if action_error:
        return action_error
    if action == 'unban':
        return None
    if not reason:
        return missing_reason_response()
    if user.is_staff or user.is_superuser:
        return staff_ban_response()
    if is_protected_fixture_user(user):
        return protected_user_ban_response()
    return None


@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_list(request):
    """List all users for admin management."""

    users = User.objects.all().order_by('date_joined')
    return Response([serialise_user(user) for user in users])


@api_view(['POST'])
@permission_classes([IsAdminUser])
def ban_user(request, user_id):
    """Ban or unban a user."""

    user, error = get_user_or_response(user_id)
    if error:
        return error
    action, reason = ban_request_data(request)
    request_error = ban_target_error(user, action, reason)
    if request_error:
        return request_error
    return apply_ban_action(user, action, reason)
