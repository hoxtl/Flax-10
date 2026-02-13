from rest_framework import serializers
from studyFlax.models import User


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
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = ['id']


class LoggedUserSerialiser(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
