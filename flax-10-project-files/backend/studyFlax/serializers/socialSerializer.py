from rest_framework import serializers
from django.contrib.auth import get_user_model
from studyFlax.models.social.followModel import Follow

User = get_user_model()

class FollowUserSerializer(serializers.ModelSerializer):
    """Serializer for displaying simple user info in follow lists."""
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name')


class FollowSerializer(serializers.ModelSerializer):
    """Serializer purely representing the Follow relationship."""
    class Meta:
        model = Follow
        fields = ('id', 'follower', 'followed', 'created_at')
        read_only_fields = ('follower',)

    def validate(self, data):
        """Ensure a user cannot follow themselves."""
        request = self.context.get('request')
        if request and request.user == data.get('followed'):
            raise serializers.ValidationError("You cannot follow yourself.")
        return data

    def create(self, validated_data):
        """Automatically set the follower to the current user."""
        request = self.context.get('request')
        validated_data['follower'] = request.user
        return super().create(validated_data)
