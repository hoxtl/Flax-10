from rest_framework import serializers
from studyFlax.models import User
from studyFlax.models.auth.userSettingsModel import UserSettings


class RegistrationUserSerialiser(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(write_only=True, required=True, allow_blank=False)
    last_name = serializers.CharField(max_length=150, required=True, allow_blank=False)

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "The passwords do not match!"})
        return data

    def validate_username(self, user_value):
        if User.objects.filter(username=user_value).exists():
            raise serializers.ValidationError("This username is already taken!")
        return user_value

    def validate_email(self, email_value):
        if User.objects.filter(email=email_value).exists():
            raise serializers.ValidationError("This email is already registered")
        return email_value

    def validate_first_name(self, name_value):
        if name_value == '' or not name_value:
            raise serializers.ValidationError("First name cannot be empty")
        return name_value

    def validate_last_name(self, lastname_value):
        if lastname_value == '' or not lastname_value:
            raise serializers.ValidationError("Last name cannot be empty")
        return lastname_value


class UserSerialiser(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    year = serializers.SerializerMethodField()
    major = serializers.SerializerMethodField()
    bio = serializers.CharField(read_only=True)
    profile_photo_url = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'name', 'year', 'major',
            'bio', 'profile_photo_url',
            'follower_count', 'following_count', 'is_following',
            'role',
            'is_superuser',
        ]
        read_only_fields = ['id']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_settings_field(self, obj, field):
        settings = getattr(obj, 'settings', None)
        return getattr(settings, field, '') or ''

    def get_year(self, obj):
        return self.get_settings_field(obj, 'year')

    def get_major(self, obj):
        return self.get_settings_field(obj, 'major')

    def get_profile_photo_url(self, obj):
        if not obj.profile_photo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.profile_photo.url) if request else None

    def get_follower_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(follower=request.user).exists()
        return False


class LoggedUserSerialiser(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)