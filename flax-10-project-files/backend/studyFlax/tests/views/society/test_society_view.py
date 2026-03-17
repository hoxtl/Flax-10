from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.society.society_model import Society
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.tests.helpers.factories import (
    make_society,
    make_society_admin,
)

User = get_user_model()


class SocietyListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", email="test@example.com", password="pass")
        self.client.force_authenticate(user=self.user)

    def test_get_societies(self):
        make_society()
        response = self.client.get("/api/societies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_society(self):
        response = self.client.post("/api/societies/", {"name": "New Society", "description": "Desc"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_society_invalid(self):
        response = self.client.post("/api/societies/", {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_society_sets_admin_membership(self):
        self.client.post("/api/societies/", {"name": "My Society", "description": "Desc"})
        society = Society.objects.get(name="My Society")
        self.assertTrue(SocietyMembership.objects.filter(user=self.user, society=society).exists())


class SocietyDetailViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="admin", email="admin@example.com", password="pass")
        self.other = User.objects.create_user(username="other", email="other@example.com", password="pass")
        self.society = make_society()
        make_society_admin(self.user, self.society)
        self.client.force_authenticate(user=self.user)

    def test_get_society_detail(self):
        response = self.client.get(f"/api/societies/{self.society.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_admin"])

    def test_get_society_not_found(self):
        response = self.client.get("/api/societies/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_society_as_admin(self):
        response = self.client.patch(f"/api/societies/{self.society.id}/", {"description": "Updated"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_society_as_non_admin(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.patch(f"/api/societies/{self.society.id}/", {"description": "Hack"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_society_as_admin(self):
        response = self.client.delete(f"/api/societies/{self.society.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_society_as_non_admin(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.delete(f"/api/societies/{self.society.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_society_detail_non_member(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.get(f"/api/societies/{self.society.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_member"])
