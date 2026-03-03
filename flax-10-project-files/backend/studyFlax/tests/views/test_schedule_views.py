from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from studyFlax.models import CalendarEvent, Deadline, Enrollment, Module, Schedule
from ..base import BaseTestCase


class ScheduleViewsTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        self.url = '/api/schedules/'

        now = timezone.now()
        self.module = Module.objects.create(
            module_code='CS100',
            module_name='Foundations',
            description='Test module',
            created_by=self.user,
            start_time=now,
            end_time=now + timedelta(hours=1),
            location='Room 1',
        )
        Enrollment.objects.create(student=self.user, module=self.module)
        self.deadline = Deadline.objects.create(
            module=self.module,
            title='Coursework 1',
            deadline_type='coursework',
            start_due_date=now + timedelta(days=2),
            end_due_date=now + timedelta(days=2, hours=1),
        )

    def test_create_auto_schedule(self):
        payload = {
            'title': 'My auto plan',
            'worktime_preference': 'day',
            'week_preference': 'both',
            'deadline_preferences': [
                {'deadline_id': self.deadline.id, 'ideal_minutes_per_day': 60},
            ],
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'My auto plan')
        self.assertEqual(len(response.data['event_allocations']), 3)

        schedule = Schedule.objects.get(id=response.data['id'])
        self.assertEqual(schedule.deadlines.count(), 1)
        self.assertEqual(schedule.event_allocations.count(), 3)

    def test_delete_schedule_cascades_allocated_events(self):
        payload = {
            'title': 'Delete me',
            'deadline_preferences': [
                {'deadline_id': self.deadline.id, 'ideal_minutes_per_day': 30},
            ],
        }
        create_response = self.client.post(self.url, payload, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        schedule_id = create_response.data['id']
        self.assertGreater(CalendarEvent.objects.filter(source='auto_scheduler').count(), 0)

        delete_response = self.client.delete(f'/api/schedules/{schedule_id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Schedule.objects.filter(id=schedule_id).exists())
        self.assertEqual(CalendarEvent.objects.filter(source='auto_scheduler').count(), 0)