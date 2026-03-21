<<<<<<< HEAD
"""
Tests for society subscription views.
"""
=======
"""Tests for society subscription endpoints."""
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

<<<<<<< HEAD
from studyFlax.tests.helpers.test_model_builders import make_society, make_society_member

=======
from studyFlax.tests.helpers.factories import make_society, make_society_member
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

User = get_user_model()


class ToggleSubscriptionViewTest(TestCase):
<<<<<<< HEAD
    """Tests toggle subscription view."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="subuser", email="sub@test.com", password="pass")
        self.society = make_society()
        self.client.force_authenticate(user=self.user)
        self.url = f"/api/societies/{self.society.id}/subscribe/"

    def test_toggle_not_found_society(self):
        response = self.client.patch("/api/societies/99999/subscribe/", {"is_subscribed": True})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_toggle_not_a_member(self):
        response = self.client.patch(self.url, {"is_subscribed": True})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_toggle_subscription_on(self):
        membership = make_society_member(self.user, self.society)
        membership.is_subscribed = False
        membership.save()
        response = self.client.patch(self.url, {"is_subscribed": True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_subscribed"])

    def test_toggle_subscription_off(self):
        membership = make_society_member(self.user, self.society)
        membership.is_subscribed = True
        membership.save()
        response = self.client.patch(self.url, {"is_subscribed": False}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_subscribed"])

    def test_toggle_subscription_default_flips(self):
        membership = make_society_member(self.user, self.society)
        original = membership.is_subscribed
        response = self.client.patch(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["is_subscribed"], not original)
