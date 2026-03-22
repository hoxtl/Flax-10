"""
User management admin views.
"""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

User = get_user_model()


def serialise_user(user):
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
    return Response({'error': message}, status=status.HTTP_404_NOT_FOUND)


def invalid_action_response():
    return Response({'error': 'Invalid action. Use "ban" or "unban".'}, status=status.HTTP_400_BAD_REQUEST)


def staff_ban_response():
    return Response({'error': 'Cannot ban staff users'}, status=status.HTTP_400_BAD_REQUEST)


def get_user_or_response(user_id):
    try:
        return User.objects.get(id=user_id), None
    except User.DoesNotExist:
        return None, not_found('User not found')


def apply_ban_action(user, action, reason):
    is_ban = action == 'ban'
    user.is_active = not is_ban
    user.ban_reason = reason if is_ban else ''
    user.save()
    verb = 'banned' if is_ban else 'unbanned'
    return Response({'message': f'{user.username} has been {verb}.', 'is_active': user.is_active})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_list(request):
    users = User.objects.all().order_by('date_joined')
    return Response([serialise_user(user) for user in users])


@api_view(['POST'])
@permission_classes([IsAdminUser])
def ban_user(request, user_id):
    user, error = get_user_or_response(user_id)
    if error:
        return error
    if user.is_staff:
        return staff_ban_response()
    action = request.data.get('action', 'ban')
    if action not in ('ban', 'unban'):
        return invalid_action_response()
    return apply_ban_action(user, action, request.data.get('reason', ''))
