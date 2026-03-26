"""
Serialisers for password reset request and confirmation.
"""

from rest_framework import serializers


class ResetPasswordSerialiser(serializers.Serializer):
    """Serialiser for reset password."""
    email = serializers.EmailField()

    def normalise_lowercase_email(self, email_value):
        return email_value.lower().strip()

class ResetPasswordConfirmSerialiser(serializers.Serializer):
    """Serialiser for reset password confirm."""
    token = serializers.CharField(max_length=100)
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate_passwords(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "The two passwords do not match!"})
        return data
