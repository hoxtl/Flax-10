from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from studyFlax.models.society.societyReportModel import SocietyReport

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_list(request):
    """Return all users with basic info for the admin dashboard."""
    users = User.objects.all().order_by('date_joined')
    data = [_serialize_user(u) for u in users]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def ban_user(request, user_id):
    """Ban or unban a user by their ID."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if user.is_staff:
        return Response({'error': 'Cannot ban staff users'}, status=status.HTTP_400_BAD_REQUEST)

    reason = request.data.get('reason', '')
    action = request.data.get('action', 'ban')  # 'ban' or 'unban'

    if action == 'ban':
        user.is_active = False
        user.ban_reason = reason
        user.save()
        return Response({'message': f'{user.username} has been banned.', 'is_active': False})
    elif action == 'unban':
        user.is_active = True
        user.ban_reason = ''
        user.save()
        return Response({'message': f'{user.username} has been unbanned.', 'is_active': True})
    else:
        return Response({'error': 'Invalid action. Use "ban" or "unban".'}, status=status.HTTP_400_BAD_REQUEST)
