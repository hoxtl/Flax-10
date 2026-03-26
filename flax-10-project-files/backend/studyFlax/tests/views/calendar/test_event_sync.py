"""
Backend tests for event sync.
"""

from django.test import TestCase
from unittest.mock import patch
from studyFlax.views.calendar.event_view import safe_sync_timetable


class EventSyncTests(TestCase):
    """Test suite for event synchronization logic."""

    @patch('studyFlax.views.calendar.event_view.sync_timetable_if_needed')
    def test_safe_sync_success(self, mock_sync):
        user = "mock_user"
        safe_sync_timetable(user)
        mock_sync.assert_called_once_with(user)

    @patch('studyFlax.views.calendar.event_view.sync_timetable_if_needed')
    @patch('studyFlax.views.calendar.event_view.logger.debug')
    def test_safe_sync_exception(self, mock_debug, mock_sync):
        mock_sync.side_effect = Exception("Sync failed")
        user = "mock_user"
        safe_sync_timetable(user)
        mock_sync.assert_called_once_with(user)
        mock_debug.assert_not_called()

    @patch('studyFlax.views.calendar.event_view._is_running_tests', return_value=False)
    @patch('studyFlax.views.calendar.event_view.logger')
    def test_log_timetable_sync_error_called(self, mock_logger, _mock_running):
        from studyFlax.views.calendar.event_view import _log_timetable_sync_error

        _log_timetable_sync_error(Exception('sync failed'))
        mock_logger.debug.assert_called_once()

    @patch('studyFlax.views.calendar.event_view.sync_timetable_if_needed')
    @patch('studyFlax.views.calendar.event_view._is_running_tests', return_value=False)
    @patch('studyFlax.views.calendar.event_view.logger.debug')
    def test_safe_sync_logs_timetable_error_when_not_testing(
        self,
        mock_debug,
        _mock_running,
        mock_sync,
    ):
        mock_sync.side_effect = Exception("sync failed")

        safe_sync_timetable("mock_user")

        mock_debug.assert_called_once()
