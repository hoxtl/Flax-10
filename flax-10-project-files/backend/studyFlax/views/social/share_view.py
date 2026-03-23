"""
ViewSet for managing calendar sharing relationships between users.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from studyFlax.models.social.share_model import CalendarShare
from studyFlax.models.notifications.notification_model import Notification
from studyFlax.serialisers.social.social_serialisers import (
    CalendarShareSerialiser,
    CalendarShareUserSerialiser,
)

User = get_user_model()

def _notify_calendar_shared(owner, target_user):
    """Send a notification to the user receiving a calendar share."""

    Notification.objects.create(
        user=target_user,
        title="Calendar Shared",
        message=f"{owner.first_name} {owner.last_name} (@{owner.username}) has shared their calendar with you.",
        notification_type='general',
        action_url=f"profile_{owner.id}",
    )

def _get_user_or_404(pk):
    """Return the User with the given pk, or None if not found."""

    try:
        return User.objects.get(pk=pk)
    except User.DoesNotExist:
        return None

class CalendarShareViewSet(viewsets.GenericViewSet):
    """ViewSet for managing calendar sharing relationships."""

    permission_classes = [permissions.IsAuthenticated]
    queryset = CalendarShare.objects.all()
    serializer_class = CalendarShareSerialiser

    @action(detail=True, methods=['post'], url_path='share')
    def share(self, request, pk=None):
        """Share the current user's calendar with another user."""

        target_user = _get_user_or_404(pk)
        if not target_user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        if str(request.user.id) == str(pk):
            return Response({"error": "You cannot share with yourself."}, status=status.HTTP_400_BAD_REQUEST)
        share_obj, created = CalendarShare.objects.get_or_create(owner=request.user, shared_with=target_user)
        if not created:
            return Response({"error": "You are already sharing with this user."}, status=status.HTTP_400_BAD_REQUEST)
        _notify_calendar_shared(request.user, target_user)
        return Response(CalendarShareSerialiser(share_obj).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='unshare')
    def unshare(self, request, pk=None):
        """Stop sharing the current user's calendar with another user."""

        target_user = _get_user_or_404(pk)
        if not target_user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        deleted, _ = CalendarShare.objects.filter(owner=request.user, shared_with=target_user).delete()
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "You are not sharing with this user."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='sharing-with')
    def sharing_with(self, request, pk=None):
        """Return users that the specified user has shared their calendar with."""

        target_user = _get_user_or_404(pk)
        if not target_user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        shared_with_users = User.objects.filter(shared_with_me__owner=target_user)
        page = self.paginate_queryset(shared_with_users)
        if page is not None:  # pragma: no cover
            serialiser = CalendarShareUserSerialiser(page, many=True, context={'request': request})
            return self.get_paginated_response(serialiser.data)
        serialiser = CalendarShareUserSerialiser(shared_with_users, many=True, context={'request': request})
        return Response(serialiser.data)

    @action(detail=True, methods=['get'], url_path='shared-with-me')
    def shared_with_me(self, request, pk=None):
        """Return users who have shared their calendar with the specified user."""

        target_user = _get_user_or_404(pk)
        if not target_user:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        owners = User.objects.filter(sharing_with__shared_with=target_user)
        page = self.paginate_queryset(owners)
        if page is not None:  # pragma: no cover
            serialiser = CalendarShareUserSerialiser(page, many=True, context={'request': request})
            return self.get_paginated_response(serialiser.data)
        serialiser = CalendarShareUserSerialiser(owners, many=True, context={'request': request})
        return Response(serialiser.data)
