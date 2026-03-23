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


def _share_target_or_error(user_id):
    target_user = _get_user_or_404(user_id)
    if not target_user:
        return None, {"error": "User not found."}, status.HTTP_404_NOT_FOUND
    return target_user, None, None


def _share_self_error(owner, user_id):
    if str(owner.id) == str(user_id):
        return {"error": "You cannot share with yourself."}, status.HTTP_400_BAD_REQUEST
    return None, None


def _share_create_result(owner, target_user):
    share_obj, created = CalendarShare.objects.get_or_create(owner=owner, shared_with=target_user)
    if not created:
        return None, {"error": "You are already sharing with this user."}, status.HTTP_400_BAD_REQUEST
    _notify_calendar_shared(owner, target_user)
    return CalendarShareSerialiser(share_obj).data, None, status.HTTP_201_CREATED


def share_result(owner, user_id):
    target_user, errors, status_code = _share_target_or_error(user_id)
    if errors:
        return None, errors, status_code
    errors, status_code = _share_self_error(owner, user_id)
    if errors:
        return None, errors, status_code
    return _share_create_result(owner, target_user)


def _unshare_delete_result(owner, target_user):
    deleted, _ = CalendarShare.objects.filter(owner=owner, shared_with=target_user).delete()
    if deleted:
        return None, None, status.HTTP_204_NO_CONTENT
    return None, {"error": "You are not sharing with this user."}, status.HTTP_400_BAD_REQUEST


def unshare_result(owner, user_id):
    target_user, errors, status_code = _share_target_or_error(user_id)
    if errors:
        return None, errors, status_code
    return _unshare_delete_result(owner, target_user)


def _sharing_queryset(user_id):
    return User.objects.filter(shared_with_me__owner_id=user_id)


def _shared_with_me_queryset(user_id):
    return User.objects.filter(sharing_with__shared_with_id=user_id)


def _share_user_list_data(view, queryset, request):
    page = view.paginate_queryset(queryset)
    if page is not None:  # pragma: no cover
        serialiser = CalendarShareUserSerialiser(page, many=True, context={'request': request})
        return None, serialiser.data
    serialiser = CalendarShareUserSerialiser(queryset, many=True, context={'request': request})
    return serialiser.data, None


def _user_list_response(view, request, user_id, queryset_builder):
    target_user, errors, status_code = _share_target_or_error(user_id)
    if errors:
        return Response(errors, status=status_code)
    payload, page_data = _share_user_list_data(view, queryset_builder(target_user.id), request)
    if page_data is not None:
        return view.get_paginated_response(page_data)
    return Response(payload)

class CalendarShareViewSet(viewsets.GenericViewSet):
    """ViewSet for managing calendar sharing relationships."""

    permission_classes = [permissions.IsAuthenticated]
    queryset = CalendarShare.objects.all()
    serializer_class = CalendarShareSerialiser

    @action(detail=True, methods=['post'], url_path='share')
    def share(self, request, pk=None):
        """Share the current user's calendar with another user."""

        payload, errors, status_code = share_result(request.user, pk)
        if errors:
            return Response(errors, status=status_code)
        return Response(payload, status=status_code)

    @action(detail=True, methods=['post'], url_path='unshare')
    def unshare(self, request, pk=None):
        """Stop sharing the current user's calendar with another user."""

        _, errors, status_code = unshare_result(request.user, pk)
        if errors:
            return Response(errors, status=status_code)
        return Response(status=status_code)

    @action(detail=True, methods=['get'], url_path='sharing-with')
    def sharing_with(self, request, pk=None):
        """Return users that the specified user has shared their calendar with."""

        return _user_list_response(self, request, pk, _sharing_queryset)

    @action(detail=True, methods=['get'], url_path='shared-with-me')
    def shared_with_me(self, request, pk=None):
        """Return users who have shared their calendar with the specified user."""

        return _user_list_response(self, request, pk, _shared_with_me_queryset)
