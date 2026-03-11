from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token

from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyReportModel import SocietyReport

User = get_user_model()


def make_admin(username='admin', password='adminpass'):
    return User.objects.create_superuser(
        username=username, email=f'{username}@example.com', password=password,
        is_staff=True, is_superuser=True,
    )


def make_user(username='user', password='userpass', role='student', is_active=True):
    return User.objects.create_user(
        username=username, email=f'{username}@example.com',
        password=password, is_active=is_active,
    )


def authed_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client
