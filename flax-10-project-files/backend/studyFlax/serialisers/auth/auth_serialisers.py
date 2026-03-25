"""
Serialisers for user registration, authentication, and profile display.
"""

from rest_framework import serializers
from studyFlax.models import User
from studyFlax.serialisers.user.user_settings_serialisers import UserSettingsSerialiser
from studyFlax.serialisers.common import (
    build_profile_photo_url,
    can_view_user_stats,
    format_teacher_name,
    is_shared_with_requester,
    is_user_sharing_with,
)

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

class UserSerialiser(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    year = serializers.SerializerMethodField()
    major = serializers.SerializerMethodField()
    settings = UserSettingsSerialiser(read_only=True)
    bio = serializers.CharField(read_only=True)
    profile_photo_url = serializers.SerializerMethodField()
    shared_by_count = serializers.SerializerMethodField()
    shared_with_count = serializers.SerializerMethodField()
    is_shared_with_me = serializers.SerializerMethodField()
    is_sharing = serializers.SerializerMethodField()
    modules = serializers.SerializerMethodField()
    study_hours_this_week = serializers.SerializerMethodField()
    study_streak = serializers.SerializerMethodField(method_name='get_study_hours_this_week')

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'name', 'year', 'major',
            'bio', 'profile_photo_url',
            'settings',
            'pinned_badge_id',
            'shared_by_count', 'shared_with_count', 'is_shared_with_me', 'is_sharing',
            'modules', 'study_hours_this_week', 'study_streak',
            'role',
            'is_active',
            'ban_reason',
            'is_superuser',
        ]
        read_only_fields = ['id']

    def _get_name(self, obj):
        return format_teacher_name(obj)

    def _get_settings_field(self, obj, field):
        settings = getattr(obj, 'settings', None)
        if not settings:
            return ''
        return getattr(settings, field, '') or ''

    def _get_year(self, obj):
        return self._get_settings_field(obj, 'year')

    def _get_major(self, obj):
        return self._get_settings_field(obj, 'major')

    def _get_profile_photo_url(self, obj):
        return build_profile_photo_url(obj.profile_photo, self.context.get('request'))

    def _get_shared_by_count(self, obj):
        return obj.shared_with_me.count()

    def _get_shared_with_count(self, obj):
        return obj.sharing_with.count()

    def _get_is_shared_with_me(self, obj):
        return is_shared_with_requester(obj, self.context.get('request'))

    def _get_is_sharing(self, obj):
        return is_user_sharing_with(obj, self.context.get('request'), allow_self=True)

    def _get_modules(self, obj):
        settings = getattr(obj, 'settings', None)
        return getattr(settings, 'modules', []) if settings else []

    def _get_study_stat(self, request, _obj):
        if not can_view_user_stats(request, _obj):
            return None
        return 0

    def _get_study_hours_this_week(self, obj):
        request = self.context.get('request')
        return self._get_study_stat(request, obj)


UserSerialiser.get_name = UserSerialiser._get_name
UserSerialiser.get_settings_field = UserSerialiser._get_settings_field
UserSerialiser.get_year = UserSerialiser._get_year
UserSerialiser.get_major = UserSerialiser._get_major
UserSerialiser.get_profile_photo_url = UserSerialiser._get_profile_photo_url
UserSerialiser.get_shared_by_count = UserSerialiser._get_shared_by_count
UserSerialiser.get_shared_with_count = UserSerialiser._get_shared_with_count
UserSerialiser.get_is_shared_with_me = UserSerialiser._get_is_shared_with_me
UserSerialiser.get_is_sharing = UserSerialiser._get_is_sharing
UserSerialiser.get_modules = UserSerialiser._get_modules
UserSerialiser.get_study_hours_this_week = UserSerialiser._get_study_hours_this_week

class LoggedUserSerialiser(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
