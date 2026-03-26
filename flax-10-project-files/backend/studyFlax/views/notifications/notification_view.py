"""
Views for listing, creating, and managing user notifications.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from studyFlax.models import Notification
from studyFlax.serialisers import NotificationSerialiser


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    if request.method == 'GET':
        return get_notifications(request)
    return create_notification(request)

def get_notifications(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
    serialiser = NotificationSerialiser(notifications, many=True)

    return Response(serialiser.data)

def create_notification(request):
    serialiser = NotificationSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)

    serialiser.save(user=request.user)
    return Response(serialiser.data, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def notification_detail(request, pk):
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    notification.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    Notification.objects.filter(user=request.user).update(read=True)
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_all(request):
    Notification.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
