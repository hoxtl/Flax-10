from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from studyFlax.models import Notification
from studyFlax.serialisers import NotificationSerialiser


@api_view(['GET', 'POST'])
def notification_list(request):
    if request.method == 'GET':
        return get_notifications()
    return create_notification(request)


def get_notifications():
    notifications = Notification.objects.all()
    serialiser = NotificationSerialiser(notifications, many=True)
    return Response(serialiser.data)


def create_notification(request):
    serialiser = NotificationSerialiser(data=request.data)
    if not serialiser.is_valid():
        return Response(serialiser.errors, status=status.HTTP_400_BAD_REQUEST)
    serialiser.save()
    return Response(serialiser.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def notification_detail(request, pk):
    try:
        notification = Notification.objects.get(pk=pk)
    except Notification.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    notification.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def mark_all_read(request):
    Notification.objects.update(read=True)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['DELETE'])
def clear_all(request):
    Notification.objects.all().delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
