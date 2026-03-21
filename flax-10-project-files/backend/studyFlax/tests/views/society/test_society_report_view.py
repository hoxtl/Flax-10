<<<<<<< HEAD
"""
Tests for society report views.
"""
=======
"""Tests for society reporting endpoints."""
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.society.society_report_model import SocietyReport
<<<<<<< HEAD
from studyFlax.tests.helpers.test_model_builders import make_society

=======
from studyFlax.tests.helpers.factories import make_society
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

User = get_user_model()


class ReportSocietyViewTest(TestCase):
<<<<<<< HEAD
    """Tests report society view."""
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="reporter", email="r@test.com", password="pass")
        self.superadmin = User.objects.create_superuser(username="superadmin", email="sa@test.com", password="pass")
        self.society = make_society()
        self.client.force_authenticate(user=self.user)
        self.url = f"/api/societies/{self.society.id}/report/"

    def test_report_society_not_found(self):
        response = self.client.post("/api/societies/99999/report/", {"reason": "spam"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_report_society_missing_reason(self):
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_report_society_blank_reason(self):
        response = self.client.post(self.url, {"reason": "   "})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_report_society_success_notifies_admins(self):
        response = self.client.post(self.url, {"reason": "Spam content"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SocietyReport.objects.filter(society=self.society, reporter=self.user).exists())

    def test_report_society_success_no_admins(self):
        self.superadmin.delete()
        response = self.client.post(self.url, {"reason": "Spam"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_remove_report_success(self):
        SocietyReport.objects.create(society=self.society, reporter=self.user, reason="test")
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(SocietyReport.objects.filter(society=self.society, reporter=self.user).exists())

    def test_remove_report_not_found_society(self):
        response = self.client.delete("/api/societies/99999/report/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
