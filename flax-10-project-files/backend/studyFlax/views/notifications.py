from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from studyFlax.models import Notification
from studyFlax.serialisers.notification_serialisers import NotificationSerialiser


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    if request.method == 'GET':
        # Filter by current user
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
        serialiser = NotificationSerialiser(notifications, many=True)
        return Response(serialiser.data)
    
    # POST - create notification
    serialiser = NotificationSerialiser(data=request.data)
    if serialiser.is_valid():
        # Assign to current user
        serialiser.save(user=request.user)
        return Response(serialiser.data, status=status.HTTP_201_CREATED)
    return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def notification_detail(request, pk):
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    if request.method == 'GET':
        serialiser = NotificationSerialiser(notification)
        return Response(serialiser.data)
    if request.method == 'PATCH':
        serialiser = NotificationSerialiser(notification, data=request.data, partial=True)
        if serialiser.is_valid():
            serialiser.save()
            return Response(serialiser.data)
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
        notification.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    # Only mark current user's notifications as read
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'status': 'All notifications marked as read'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_all(request):
    # Only clear current user's notifications
    count = Notification.objects.filter(user=request.user).delete()[0]
    return Response({'status': f'Cleared {count} notifications'})
