from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from studyFlax.models.social.followModel import Follow
from studyFlax.serializers.socialSerializer import FollowSerializer, FollowUserSerializer

User = get_user_model()

class FollowViewSet(viewsets.GenericViewSet):
    """
    ViewSet for managing follower relationships.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Follow.objects.all()
    serializer_class = FollowSerializer

    @action(detail=True, methods=['post'], url_path='follow')
    def follow(self, request, pk=None):
        """Follow a user."""
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if str(request.user.id) == str(pk):
            return Response({"error": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)

        follow_obj, created = Follow.objects.get_or_create(follower=request.user, followed=target_user)
        
        if created:
            serializer = self.get_serializer(follow_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": "You are already following this user."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='unfollow')
    def unfollow(self, request, pk=None):
        """Unfollow a user."""
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        deleted, _ = Follow.objects.filter(follower=request.user, followed=target_user).delete()
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({"error": "You are not following this user."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        """Get a list of users following the specified user."""
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        followers = User.objects.filter(following__followed=target_user)
        page = self.paginate_queryset(followers)
        if page is not None:
            serializer = FollowUserSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = FollowUserSerializer(followers, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        """Get a list of users the specified user is following."""
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        following = User.objects.filter(followers__follower=target_user)
        page = self.paginate_queryset(following)
        if page is not None:
            serializer = FollowUserSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = FollowUserSerializer(following, many=True, context={'request': request})
        return Response(serializer.data)
