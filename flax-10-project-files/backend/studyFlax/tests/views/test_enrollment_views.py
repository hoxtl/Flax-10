from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from ..base import BaseTestCase
from studyFlax.models import Module, Enrollment, CalendarEvent, Deadline


class EnrollmentViewTests(BaseTestCase):
    """Tests for  """
    def setUp(self):
        super().setUp()
        self.user.role = 'teacher'
        self.user.save()
        self.module = Module.objects.create(
            module_code='5CCS2SEG', module_name='Software Enfineering',
            created_by=self.user,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )
        self.user.role = 'student'
        self.user.save()

    def test_student_can_enroll(self):
        """ Test student can enroll in a module"""
        response = self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_enrollment_creates_calendar_event(self):
        """ Test enrolling in a module creates a lecture calendar event."""
        self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        self.assertTrue(CalendarEvent.objects.filter(user=self.user, source='module_enrollment').exists())

    def test_duplicate_enrollment_is_invalid(self):
        """ Test student cannot enroll into the same module twicce."""
        self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        response = self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_cannot_enroll(self):
        """ Test teacher attempting to enrol fails"""
        self.user.role = 'teacher'
        self.user.save()
        response=self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_list_enrollments(self):
        """ Test for listing enrollments"""
        Enrollment.objects.create(student=self.user, module=self.module)
        response = self.client.get('/api/enrollments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_student_can_disenroll(self):
        """ Test student can successfully disenroll from module"""
        enrollment = Enrollment.objects.create(student=self.user, module=self.module)
        response = self.client.delete(f'/api/enrollments/{enrollment.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Enrollment.objects.filter(id=enrollment.id).exists())

    def test_disenroll_removes_calendar_events(self):
        """ Test disenrolling removes all related calendar events."""
        enrollment = Enrollment.objects.create(student=self.user, module=self.module)
        CalendarEvent.objects.create(
            user=self.user, module=self.module, title='Lecture',
            source='module_enrollment',
            start_time=self.module.start_time, end_time=self.module.end_time,
        )
        self.client.delete(f'/api/enrollments/{enrollment.id}/')
        self.assertFalse(CalendarEvent.objects.filter(
            user=self.user, module=self.module
        ).exists())

    def test_get_enrollment_detail(self):
        """ Test get enrollment detail"""
        enrollment = Enrollment.objects.create(student=self.user, module=self.module)
        response = self.client.get(f'/api/enrollments/{enrollment.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_enrollment_creates_deadline_events(self):
        """ Test enrollment into a module, updates calendar with deadlines"""
        self.user.role = 'teacher'
        self.user.save()
        Deadline.objects.create(
            module=self.module, title='CW1',
            deadline_type='coursework',
            start_due_date=timezone.now() + timedelta(days=7),
        )
        self.user.role = 'student'
        self.user.save()
        self.client.post('/api/enrollments/', {'module': self.module.id}, format='json')
        self.assertTrue(CalendarEvent.objects.filter(
            user=self.user, source='module_deadline'
        ).exists())