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

    # ✅ profile-page additions
    bio = serializers.CharField(read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'name', 'year', 'major',
            'bio', 'profile_photo_url',
            'role',
            'is_superuser',
        ]
        read_only_fields = ['id']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_year(self, obj):
        try:
            year = obj.settings.year if hasattr(obj, 'settings') and obj.settings.year else '2'
            return year if year.startswith('Year') else f'Year {year}'
        except UserSettings.DoesNotExist:
            return 'Year 2'

    def get_major(self, obj):
        try:
            return obj.settings.major if hasattr(obj, 'settings') and obj.settings.major else 'Computer Science'
        except UserSettings.DoesNotExist:
            return 'Computer Science'

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
        return None


class LoggedUserSerialiser(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
