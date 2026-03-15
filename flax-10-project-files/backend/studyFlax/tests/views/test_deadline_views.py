"""
Backend tests for deadline views.
"""

from rest_framework import status
from django.utils import timezone
from studyFlax.models import Deadline, Module, CalendarEvent, Enrollment
from datetime import timedelta
from ..base import BaseTestCase

class DeadlineViewTests(BaseTestCase):
    """ Tests for Deadline views"""
    def setUp(self):
        super().setUp()
        self.user.role = 'teacher'
        self.user.save()
        self.module = Module.objects.create(
            module_code='5CCS2SEG', module_name='Software Engineering',
            created_by=self.user,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )
        self.deadline = Deadline.objects.create(
            module=self.module, title='CW1',
            deadline_type='coursework',
            start_due_date=timezone.now() + timedelta(days=7),
        )
        self.list_url = f'/api/modules/{self.module.id}/deadlines/'
        self.detail_url = f'/api/modules/{self.module.id}/deadlines/{self.deadline.id}/'

    def test_list_deadlines(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_teacher_can_create_deadline(self):
        data = dict(title='Essay', deadline_type='coursework',
            start_due_date=(timezone.now() + timedelta(days=5)).isoformat())
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_student_cannot_create_deadline(self):
        self.user.role = 'student'
        self.user.save()
        response = self.client.post(self.list_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_deadline(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'CW1')

    def test_teacher_can_update_deadline(self):
        response = self.client.put(self.detail_url, {'title': 'Updated'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated')

    def test_teacher_can_delete_deadline(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Deadline.objects.filter(id=self.deadline.id).exists())

    def test_delete_removes_calendar_events(self):
        CalendarEvent.objects.create(
            user=self.user, module=self.module, title='Event',
            source='module_deadline', external_id=str(self.deadline.id),
            start_time=self.deadline.start_due_date, end_time=self.deadline.start_due_date,
        )
        self.client.delete(self.detail_url)
        self.assertFalse(CalendarEvent.objects.filter(external_id=str(self.deadline.id)).exists())

    def test_end_date_is_after_start_date(self):
        start = timezone.now() + timedelta(days=7)
        payload = dict(title='Exam', deadline_type='exam',
            start_due_date=start.isoformat(),
            end_due_date=(start - timedelta(hours=1)).isoformat())
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upcoming_deadlines_are_future_dates(self):
        self.user.role = 'student'
        self.user.save()
        Enrollment.objects.create(student=self.user, module=self.module)
        Deadline.objects.create(module=self.module, title='Past',
            deadline_type='coursework', start_due_date=timezone.now() - timedelta(days=1))
        response = self.client.get('/api/deadlines/upcoming/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_deadline_creates_events_for_enrolled_students(self):
        self.user.role = 'student'
        self.user.save()
        Enrollment.objects.create(student=self.user, module=self.module)
        self.user.role = 'teacher'
        self.user.save()
        response = self.client.post(self.list_url, self.deadline_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CalendarEvent.objects.filter(
            user=self.user, source='module_deadline'
        ).exists())
    
    def deadline_payload(self):
        """Build a deadline payload for requests."""
        return dict(title='New Deadline', deadline_type='coursework',
            start_due_date=(timezone.now() + timedelta(days=5)).isoformat())

    def test_update_deadline_invalid_non_teacher(self):
        deadline = Deadline.objects.create(
            module=self.module, title='D1',
            deadline_type='coursework',
            start_due_date=timezone.now() + timedelta(days=3),
        )
        self.user.role = 'student'
        self.user.save()
        response = self.client.put(
            f'{self.list_url}{deadline.id}/',
            {'title': 'Updated'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.role = 'teacher'
        self.user.save()
