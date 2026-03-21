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
    UserSettings,
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

    def test_create_manual_schedule_requires_title(self):
        event = self._build_schedule_event('Untitled Session')

        response = self.client.post(self.url, {
            'mode': 'manual',
            'event_ids': [event.id],
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'title is required for manual schedules.')

    def test_manual_schedule_same_name_overwrites_previous_and_creates_notification(self):
        first_event = self._build_schedule_event('Manual Session A')
        second_event = self._build_schedule_event('Manual Session B', start_offset_hours=2)

        first = self.client.post(self.url, {
            'mode': 'manual',
            'title': 'Manual Reusable Name',
            'event_ids': [first_event.id],
        }, format='json')
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        second = self.client.post(self.url, {
            'mode': 'manual',
            'title': 'Manual Reusable Name',
            'event_ids': [second_event.id],
        }, format='json')
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertTrue(second.data['overwritten'])
        self.assertEqual(Schedule.objects.filter(user=self.user, title='Manual Reusable Name').count(), 1)
        self.assertTrue(Notification.objects.filter(user=self.user, title='Schedule overwritten').exists())

    def test_schedule_list_get_returns_user_schedules(self):
        event = self._build_schedule_event('Listed session')
        create_response = self.client.post(self.url, {
            'mode': 'manual',
            'title': 'Listable Schedule',
            'event_ids': [event.id],
        }, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        list_response = self.client.get(self.url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]['title'], 'Listable Schedule')

    def test_schedule_detail_get_and_patch_requests(self):
        first_event = self._build_schedule_event('Patch Session A')
        second_event = self._build_schedule_event('Patch Session B', start_offset_hours=2)

        existing_response = self.client.post(self.url, {
            'mode': 'manual',
            'title': 'Existing Name',
            'event_ids': [first_event.id],
        }, format='json')
        self.assertEqual(existing_response.status_code, status.HTTP_201_CREATED)

        target_response = self.client.post(self.url, {
            'mode': 'manual',
            'title': 'Target Name',
            'event_ids': [second_event.id],
        }, format='json')
        self.assertEqual(target_response.status_code, status.HTTP_201_CREATED)
        target_id = target_response.data['id']

        get_response = self.client.get(f'/api/schedules/{target_id}/')
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data['title'], 'Target Name')

        patch_response = self.client.patch(
            f'/api/schedules/{target_id}/',
            {'title': 'Existing Name'},
            format='json',
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertTrue(patch_response.data['overwritten'])
        self.assertEqual(patch_response.data['title'], 'Existing Name')
        self.assertEqual(Schedule.objects.filter(user=self.user, title='Existing Name').count(), 1)

        invalid_patch_response = self.client.patch(
            f'/api/schedules/{target_id}/',
            {'title': '   '},
            format='json',
        )
        self.assertEqual(invalid_patch_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(invalid_patch_response.data['detail'], 'title is required.')

    def test_preferred_daily_budget_limits_allocations_per_day(self):
        second_deadline = Deadline.objects.create(
            module=self.module,
            title='Coursework 2',
            deadline_type='coursework',
            start_due_date=timezone.now() + timedelta(days=2),
            end_due_date=timezone.now() + timedelta(days=2, hours=1),
        )
        settings, _ = UserSettings.objects.get_or_create(user=self.user)
        settings.preferred_study_minutes_per_day = 60
        settings.save(update_fields=['preferred_study_minutes_per_day'])

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

    def test_create_auto_schedule_tags_generated_events_as_schedule(self):
        payload = {
            'title': 'Tagged auto plan',
            'worktime_preference': 'day',
            'week_preference': 'both',
            'deadline_preferences': [
                {'deadline_id': self.deadline.id, 'ideal_minutes_per_day': 60},
            ],
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        for allocation in response.data['event_allocations']:
            self.assertEqual(allocation['event']['tag_name'], 'Schedule')

    def test_create_manual_schedule_accepts_lowercase_schedule_tag(self):
        lower_schedule_tag = Tag.objects.create(name='schedule', user=self.user)
        start = timezone.now() + timedelta(days=1)
        event = CalendarEvent.objects.create(
            user=self.user,
            title='Session Lowercase',
            start_time=start,
            end_time=start + timedelta(hours=1),
            tag=lower_schedule_tag,
        )

        response = self.client.post(self.url, {
            'mode': 'manual',
            'title': 'Lowercase schedule plan',
            'event_ids': [event.id],
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['event_allocations']), 1)

def _build_schedule_event(self, title, start_offset_days=1, start_offset_hours=0):
        schedule_tag = Tag.objects.get(name='Schedule')
        start = timezone.now() + timedelta(days=start_offset_days, hours=start_offset_hours)
        return CalendarEvent.objects.create(
            user=self.user,
            title=title,
            start_time=start,
            end_time=start + timedelta(hours=1),
            tag=schedule_tag,
        )
