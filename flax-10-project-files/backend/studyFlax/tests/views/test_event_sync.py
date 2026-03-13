"""
Backend tests for event sync.
"""

from django.test import TestCase
from unittest.mock import patch
from studyFlax.views.calendar.event_views import safe_sync_timetable

class EventSyncTests(TestCase):
    """Test suite for event synchronization logic."""

    @patch('studyFlax.views.calendar.event_views.sync_timetable_if_needed')
    def test_safe_sync_success(self, mock_sync):
        user = "mock_user"
        safe_sync_timetable(user)
        mock_sync.assert_called_once_with(user)

    @patch('studyFlax.views.calendar.event_views.sync_timetable_if_needed')
    def test_safe_sync_exception(self, mock_sync):
        mock_sync.side_effect = Exception("Sync failed")
        user = "mock_user"
        safe_sync_timetable(user)
        mock_sync.assert_called_once_with(user)
