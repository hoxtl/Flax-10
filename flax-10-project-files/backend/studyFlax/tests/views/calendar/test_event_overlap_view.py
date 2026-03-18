"""
Backend tests for event overlap constraints.
"""

from rest_framework import status
from ..base import BaseEventTestCase
from ..fixtures import get_datetime_str


class EventCreateOverlapLimitTests(BaseEventTestCase):
    """Creating a fourth overlapping event returns 400."""

    def test_create_fourth_overlapping_event_returns_400(self):
        start = get_datetime_str(hours_offset=10)
        end = get_datetime_str(hours_offset=11)
        for i in range(3):
            self.create_event_in_db({
                'title': f'Overlap {i}',
                'start_time': start,
                'end_time': end,
            })
        data = {'title': 'Fourth Overlap', 'start_time': start, 'end_time': end}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('overlapping', response.data['error'])
