"""
Tests for reading views.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status

from ...helpers.test_case_support import BaseTestCase
from studyFlax.models import Module, Enrollment, Reading, Task
from studyFlax.views.modules.reading_task_service import (
    create_description,
    task_payload,
)


User = get_user_model()


class ReadingViewsTests(BaseTestCase):
    """Validate module reading CRUD and task conversion flows."""

    def setUp(self):
        """Set up the test case."""
        super().setUp()
        self.teacher = self.user
        self.teacher.role = 'teacher'
        self.teacher.save()
        self.student = User.objects.create_user(
            username='readerstudent',
            email='reader@student.test',
            password='pass',
        )
        self.module = Module.objects.create(
            module_code='RC101',
            module_name='Reading Club',
            created_by=self.teacher,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )

    def test_get_readings_empty(self):
        """Test get readings empty."""
        response = self.client.get(f'/api/modules/{self.module.id}/readings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    def test_create_reading(self):
        """Test create reading."""
        response = self.client.post(
            f'/api/modules/{self.module.id}/readings/',
            {
                'title': 'Chapter One',
                'chapter': 'Intro',
                'start_page': 1,
                'end_page': 10,
                'deadline': (timezone.now() + timedelta(days=5)).isoformat(),
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reading.objects.filter(module=self.module).count(), 1)

    def test_reading_detail_and_update(self):
        """Test reading detail and update."""
        reading = Reading.objects.create(
            module=self.module,
            title='Original',
            chapter='A',
            start_page=1,
            end_page=20,
            deadline=timezone.now() + timedelta(days=4),
        )
        response = self.client.get(f'/api/modules/{self.module.id}/readings/{reading.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response = self.client.put(
            f'/api/modules/{self.module.id}/readings/{reading.id}/',
            {'title': 'Updated'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reading.refresh_from_db()
        self.assertEqual(reading.title, 'Updated')

    def test_delete_reading(self):
        """Test delete reading."""
        reading = Reading.objects.create(
            module=self.module,
            title='To Delete',
            start_page=1,
            end_page=5,
            deadline=timezone.now() + timedelta(days=7),
        )
        response = self.client.delete(f'/api/modules/{self.module.id}/readings/{reading.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Reading.objects.filter(id=reading.id).exists())

    def test_load_task_creates_task(self):
        """Test load task creates task."""
        reading = Reading.objects.create(
            module=self.module,
            title='To Task',
            start_page=1,
            end_page=10,
            deadline=timezone.now() + timedelta(days=3),
        )
        response = self.client.post(f'/api/readings/{reading.id}/load-task/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.filter(reading=reading, user=self.teacher).count(), 1)
        payload = response.json()
        created_task = reading.tasks.get()
        self.assertEqual(payload['estimated_blocks'], task_payload(created_task)['estimated_blocks'])

    def test_suggested_readings(self):
        """Test suggested readings."""
        self.client.force_authenticate(user=self.student)
        Enrollment.objects.create(student=self.student, module=self.module)
        reading = Reading.objects.create(
            module=self.module,
            title='Suggested',
            start_page=1,
            end_page=5,
            deadline=timezone.now() + timedelta(days=2),
        )
        response = self.client.get('/api/readings/suggested/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        ids = [item['id'] for item in payload]
        self.assertIn(reading.id, ids)

    def test_reading_speed_default_time(self):
        """Test reading speed default time."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/readings/speed/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['avg_min_per_page'], 2.0)

    def test_create_description(self):
        """Test create description."""
        reading = Reading.objects.create(
            module=self.module,
            title='Reading',
            chapter='Unit',
            start_page=5,
            end_page=9,
            deadline=timezone.now() + timedelta(days=1),
        )
        self.assertEqual(create_description(reading), 'Reading, Unit, pages. 5-9')

    def test_get_reading_list_without_module_calls_generic_search(self):
        """Test get reading list without module calls generic search."""
        from studyFlax.models.tasks.task_model import TaskList
        from studyFlax.views.modules.reading_task_lists import get_reading_list
        TaskList.objects.create(user=self.teacher, name='My reading notes', archived=False)
        result = get_reading_list(self.teacher, module=None)
        self.assertIsNotNone(result)
        self.assertEqual(result.name, 'My reading notes')

    def test_task_payload_format(self):
        """Test task payload format."""
        reading = Reading.objects.create(
            module=self.module,
            title='Payload',
            start_page=1,
            end_page=3,
            deadline=timezone.now() + timedelta(days=1),
        )
        reading.refresh_from_db()
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f'/api/readings/{reading.id}/load-task/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(
            set(data.keys()),
            {'id', 'title', 'due_date', 'estimated_blocks', 'reading_id', 'task_list', 'page_count'},
        )

    def test_update_reading_invalid_data(self):
        """Test update reading invalid data."""
        reading = Reading.objects.create(
            module=self.module,
            title='Original',
            start_page=1,
            end_page=10,
            deadline=timezone.now() + timedelta(days=1),
        )
        response = self.client.put(
            f'/api/modules/{self.module.id}/readings/{reading.id}/',
            {'title': '', 'start_page': 20, 'end_page': 10},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
