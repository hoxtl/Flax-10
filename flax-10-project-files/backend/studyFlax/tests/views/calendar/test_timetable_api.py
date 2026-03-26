"""
Tests for timetable API views.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from unittest.mock import patch


User = get_user_model()

class TimetableViewTest(TestCase):
    """Tests timetable view."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='tvuser', email='tv@example.com', password='pass'
        )
        self.client.force_authenticate(user=self.user)

    def test_import_missing_url(self):
        response = self.client.post('/api/timetable/import/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('source_url', response.data['detail'].lower())

    def test_import_invalid_protocol(self):
        response = self.client.post('/api/timetable/import/', {'source_url': 'ftp://bad.com/cal.ics'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('protocol', response.data['detail'].lower())

    def test_import_empty_url(self):
        response = self.client.post('/api/timetable/import/', {'source_url': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('studyFlax.views.calendar.timetable_view.sync_timetable')
    def test_import_success(self, mock_sync):
        mock_sync.return_value = {'created': 3, 'updated': 0, 'source_url': 'https://example.com/cal.ics'}
        response = self.client.post('/api/timetable/import/', {'source_url': 'https://example.com/cal.ics'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 3)

    @patch('studyFlax.views.calendar.timetable_view.sync_timetable')
    def test_import_value_error(self, mock_sync):
        mock_sync.side_effect = ValueError('No .ics link found')
        response = self.client.post('/api/timetable/import/', {'source_url': 'https://example.com/page'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No .ics', response.data['detail'])

    def test_import_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/timetable/import/', {'source_url': 'https://example.com/cal.ics'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_validate_source_url_strips_whitespace(self):
        from studyFlax.views.calendar.timetable_view import validate_source_url
        url, err = validate_source_url('  https://example.com/cal.ics  extra')
        self.assertEqual(url, 'https://example.com/cal.ics')
        self.assertIsNone(err)

    def test_validate_source_url_none(self):
        from studyFlax.views.calendar.timetable_view import validate_source_url
        url, err = validate_source_url(None)
        self.assertIsNone(url)
        self.assertIsNotNone(err)
