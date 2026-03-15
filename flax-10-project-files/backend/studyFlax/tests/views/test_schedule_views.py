from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from studyFlax.models import (
    CalendarEvent,
    Deadline,
    Enrollment,
    Module,
    Notification,
    Schedule,
    Tag,
)
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
        self.assertEqual(schedule.deadline.count(), 1)
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

    def test_same_name_schedule_overwrites_previous_and_creates_notification(self):
        payload = {
            'title': 'Reusable Name',
            'worktime_preference': 'day',
            'week_preference': 'both',
            'deadline_preferences': [
                {'deadline_id': self.deadline.id, 'ideal_minutes_per_day': 30},
            ],
        }
        first = self.client.post(self.url, payload, format='json')
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        second = self.client.post(self.url, payload, format='json')
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertTrue(second.data['overwritten'])
        self.assertEqual(Schedule.objects.filter(user=self.user, title='Reusable Name').count(), 1)
        self.assertTrue(Notification.objects.filter(user=self.user, title='Schedule overwritten').exists())


    def test_create_manual_schedule_from_existing_schedule_tagged_events(self):
        tag = Tag.objects.create(name='schedule', is_default=True)
        start = timezone.now() + timedelta(days=1)
        event_1 = CalendarEvent.objects.create(
            user=self.user,
            title='Session A',
            start_time=start,
            end_time=start + timedelta(hours=1),
            tag=tag,
        )
        event_2 = CalendarEvent.objects.create(
            user=self.user,
            title='Session B',
            start_time=start + timedelta(hours=2),
            end_time=start + timedelta(hours=3),
            tag=tag,
        )

        response = self.client.post(self.url, {
            'mode': 'manual',
            'title': 'Named schedule',
            'event_ids': [event_1.id, event_2.id],
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Named schedule')
        self.assertEqual(len(response.data['event_allocations']), 2)

    def test_same_name_schedule_overwrites_previous_and_creates_notification(self):
        payload = {
            'title': 'Reusable Name',
            'worktime_preference': 'day',
            'week_preference': 'both',
            'deadline_preferences': [
                {'deadline_id': self.deadline.id, 'ideal_minutes_per_day': 30},
            ],
        }
        first = self.client.post(self.url, payload, format='json')
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        second = self.client.post(self.url, payload, format='json')
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertTrue(second.data['overwritten'])
        self.assertEqual(Schedule.objects.filter(user=self.user, title='Reusable Name').count(), 1)
        self.assertTrue(Notification.objects.filter(user=self.user, title='Schedule overwritten').exists())

    def test_preferred_daily_budget_limits_allocations_per_day(self):
        second_deadline = Deadline.objects.create(
            module=self.module,
            title='Coursework 2',
            deadline_type='coursework',
            start_due_date=timezone.now() + timedelta(days=2),
            end_due_date=timezone.now() + timedelta(days=2, hours=1),
        )
        self.user.settings.preferred_study_minutes_per_day = 60
        self.user.settings.save(update_fields=['preferred_study_minutes_per_day'])

        payload = {
            'title': 'Budgeted plan',
            'worktime_preference': 'day',
            'week_preference': 'both',
            'deadline_preferences': [
                {'deadline_id': self.deadline.id, 'ideal_minutes_per_day': 45},
                {'deadline_id': second_deadline.id, 'ideal_minutes_per_day': 45},
            ],
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 3 days * 60 max daily budget
        total_allocated = sum(a['allocated_minutes'] for a in response.data['event_allocations'])
        self.assertEqual(total_allocated, 180)
