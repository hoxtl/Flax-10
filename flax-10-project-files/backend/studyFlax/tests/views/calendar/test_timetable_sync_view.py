"""
Tests for timetable import view error behaviour.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
User = get_user_model()


class TimetableImportViewTest(TestCase):
    """Tests for the timetable import endpoint's error response."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="tt_view", email="ttview@example.com", password="pass",
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/timetable/import/"

    def test_sync_error_returns_503(self):
        from unittest.mock import patch

        from studyFlax.views.calendar.timetable_service import TimetableSyncError

        with patch("studyFlax.views.calendar.timetable_view.sync_timetable") as mock_sync:
            mock_sync.side_effect = TimetableSyncError("upstream failed")
            response = self.client.post(self.url, {"source_url": "https://example.com/cal.ics"}, format="json")
            self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            self.assertIn("Unable to sync", response.data["detail"])
