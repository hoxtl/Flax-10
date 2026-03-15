from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from studyFlax.models.social.shareModel import CalendarShare
from studyFlax.serializers.socialSerializer import CalendarShareSerializer, CalendarShareUserSerializer
from studyFlax.models.notifications.notificationModel import Notification

User = get_user_model()

class CalendarShareViewSet(viewsets.GenericViewSet):
    """
    ViewSet for managing calendar sharing relationships.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = CalendarShare.objects.all()
    serializer_class = CalendarShareSerializer

    @action(detail=True, methods=['post'], url_path='share')
    def share(self, request, pk=None):
        """Share calendar with a user."""
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if str(request.user.id) == str(pk):
            return Response({"error": "You cannot share with yourself."}, status=status.HTTP_400_BAD_REQUEST)

        # request.user is the owner, target_user is receiving the share
        share_obj, created = CalendarShare.objects.get_or_create(owner=request.user, shared_with=target_user)
        
        if created:
            Notification.objects.create(
                user=target_user,
                title="Calendar Shared",
                message=f"{request.user.first_name} {request.user.last_name} (@{request.user.username}) has shared their calendar with you.",
                notification_type='general',
                action_url=f"profile_{request.user.id}"
            )
            serializer = self.get_serializer(share_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": "You are already sharing with this user."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='unshare')
    def unshare(self, request, pk=None):
        """Stop sharing calendar with a user."""
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        deleted, _ = CalendarShare.objects.filter(owner=request.user, shared_with=target_user).delete()
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({"error": "You are not sharing with this user."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='sharing-with')
    def sharing_with(self, request, pk=None):
        """Get a list of users this user has shared their calendar with. (Users who can 'view' this user's calendar)"""
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Users target_user shares with
        shared_with_users = User.objects.filter(shared_with_me__owner=target_user)
        page = self.paginate_queryset(shared_with_users)
        if page is not None:  # pragma: no cover
            serializer = CalendarShareUserSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = CalendarShareUserSerializer(shared_with_users, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='shared-with-me')
    def shared_with_me(self, request, pk=None):
        """Get a list of users who have shared their calendar with the specified user. (Calendars this user can 'view')"""
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Users who share with target_user
        owners = User.objects.filter(sharing_with__shared_with=target_user)
        page = self.paginate_queryset(owners)
        if page is not None:  # pragma: no cover
            serializer = CalendarShareUserSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = CalendarShareUserSerializer(owners, many=True, context={'request': request})
        return Response(serializer.data)
