"""
Tests for schedule views.
"""

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
from ..helpers.test_case_support import BaseTestCase


class ScheduleViewsTests(BaseTestCase):
    """Tests schedule views."""

    def _create_module_and_deadline(self, now):
        """Create a test module, enrolment, and deadline for the current user."""
        module = Module.objects.create(
            module_code='CS100',
            module_name='Foundations',
            description='Test module',
            created_by=self.user,
            start_time=now,
            end_time=now + timedelta(hours=1),
            location='Room 1',
        )
        Enrollment.objects.create(student=self.user, module=module)
        deadline = Deadline.objects.create(
            module=module,
            title='Coursework 1',
            deadline_type='coursework',
            start_due_date=now + timedelta(days=2),
            end_due_date=now + timedelta(days=2, hours=1),
        )
        return module, deadline

    def setUp(self):
        super().setUp()
        self.url = '/api/schedules/'
        now = timezone.now()
        self.module, self.deadline = self._create_module_and_deadline(now)

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

    def _create_tagged_event(self, title, tag, start_offset_hours=0):
        start = timezone.now() + timedelta(days=1, hours=start_offset_hours)
        return CalendarEvent.objects.create(
            user=self.user, title=title, tag=tag,
            start_time=start, end_time=start + timedelta(hours=1),
        )

    def test_create_manual_schedule_from_existing_schedule_tagged_events(self):
        tag = Tag.objects.create(name='schedule', is_default=True)
        event_1 = self._create_tagged_event('Session A', tag)
        event_2 = self._create_tagged_event('Session B', tag, start_offset_hours=2)

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

    def _create_manual_schedule(self, title, event):
        response = self.client.post(self.url, {
            'mode': 'manual', 'title': title, 'event_ids': [event.id],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data['id']

    def test_schedule_detail_get_returns_schedule(self):
        event = self._build_schedule_event('Get Session')
        schedule_id = self._create_manual_schedule('Get Target', event)

        response = self.client.get(f'/api/schedules/{schedule_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Get Target')

    def test_schedule_patch_overwrites_existing_same_name(self):
        first_event = self._build_schedule_event('Patch Session A')
        second_event = self._build_schedule_event('Patch Session B', start_offset_hours=2)
        self._create_manual_schedule('Existing Name', first_event)
        target_id = self._create_manual_schedule('Target Name', second_event)

        response = self.client.patch(f'/api/schedules/{target_id}/', {'title': 'Existing Name'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['overwritten'])
        self.assertEqual(Schedule.objects.filter(user=self.user, title='Existing Name').count(), 1)

    def test_schedule_patch_rejects_blank_title(self):
        event = self._build_schedule_event('Blank Title Session')
        schedule_id = self._create_manual_schedule('Valid Name', event)

        response = self.client.patch(f'/api/schedules/{schedule_id}/', {'title': '   '}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'title is required.')

    def _create_second_deadline(self):
        return Deadline.objects.create(
            module=self.module, title='Coursework 2', deadline_type='coursework',
            start_due_date=timezone.now() + timedelta(days=2),
            end_due_date=timezone.now() + timedelta(days=2, hours=1),
        )

    def _set_daily_budget(self, minutes):
        settings, _ = UserSettings.objects.get_or_create(user=self.user)
        settings.preferred_study_minutes_per_day = minutes
        settings.save(update_fields=['preferred_study_minutes_per_day'])

    def test_preferred_daily_budget_limits_allocations_per_day(self):
        second_deadline = self._create_second_deadline()
        self._set_daily_budget(60)

        payload = {
            'title': 'Budgeted plan', 'worktime_preference': 'day', 'week_preference': 'both',
            'deadline_preferences': [
                {'deadline_id': self.deadline.id, 'ideal_minutes_per_day': 45},
                {'deadline_id': second_deadline.id, 'ideal_minutes_per_day': 45},
            ],
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
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
        schedule_tag, _ = Tag.objects.get_or_create(name='Schedule', defaults={'is_default': True})
        start = timezone.now() + timedelta(days=start_offset_days, hours=start_offset_hours)
        return CalendarEvent.objects.create(
            user=self.user,
            title=title,
            start_time=start,
            end_time=start + timedelta(hours=1),
            tag=schedule_tag,
        )

    def test_manual_schedule_rejects_empty_event_ids(self):
        response = self.client.post(self.url, {
            'mode': 'manual', 'title': 'Test', 'event_ids': [],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('event_ids', response.data['detail'])

    def test_manual_schedule_rejects_untagged_events(self):
        start = timezone.now() + timedelta(days=1)
        untagged_event = CalendarEvent.objects.create(
            user=self.user, title='No tag',
            start_time=start, end_time=start + timedelta(hours=1),
        )
        response = self.client.post(self.url, {
            'mode': 'manual', 'title': 'Test', 'event_ids': [untagged_event.id],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('invalid', response.data['detail'])

    def test_auto_schedule_rejects_invalid_serialiser_data(self):
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_auto_schedule_rejects_nonexistent_deadline(self):
        payload = {
            'title': 'Bad deadline',
            'deadline_preferences': [{'deadline_id': 99999, 'ideal_minutes_per_day': 30}],
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid deadlines', response.data['detail'])

    def test_auto_schedule_with_clear_existing_deletes_old_schedules(self):
        first_payload = {
            'title': 'First plan',
            'deadline_preferences': [{'deadline_id': self.deadline.id, 'ideal_minutes_per_day': 30}],
        }
        self.client.post(self.url, first_payload, format='json')
        self.assertEqual(Schedule.objects.filter(user=self.user).count(), 1)
        second_payload = {
            'title': 'Fresh start',
            'clear_existing': True,
            'deadline_preferences': [{'deadline_id': self.deadline.id, 'ideal_minutes_per_day': 30}],
        }
        response = self.client.post(self.url, second_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Schedule.objects.filter(user=self.user).count(), 1)

    def test_auto_schedule_rejects_duplicate_deadline_ids(self):
        payload = {
            'title': 'Dup deadlines',
            'deadline_preferences': [
                {'deadline_id': self.deadline.id, 'ideal_minutes_per_day': 30},
                {'deadline_id': self.deadline.id, 'ideal_minutes_per_day': 60},
            ],
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
