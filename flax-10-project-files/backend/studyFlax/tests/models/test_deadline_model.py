"""
Backend tests for deadline model.
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from studyFlax.models.auth.user_model import User
from studyFlax.models.modules.module_model import Module
from studyFlax.models.modules.deadline_model import Deadline

class DeadlineModelTests(TestCase):
    """Test suite for Deadline model."""
    def setUp(self):
        self.teacher = User.objects.create_user(
            username='teacher', email='teacher@test.com',
            password='Password', first_name='Teacher', last_name='Test', role='teacher'
        )
        self.module = Module.objects.create(
            module_code='5CCS2SEG', module_name='Software Engineering',
            created_by=self.teacher,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )

    def create_deadline(self, **kwargs):
        defaults = dict(
            module=self.module, title='CW1',
            deadline_type='coursework',
            start_due_date=timezone.now() + timedelta(days=7),
        )
        defaults.update(kwargs)
        return Deadline.objects.create(**defaults)

    def test_deadline_creation(self):
        deadline = self.create_deadline()
        self.assertIsInstance(deadline, Deadline)

    def test_optional_fields_default_to_none(self):
        deadline = self.create_deadline()
        self.assertIsNone(deadline.end_due_date)
        self.assertIsNone(deadline.location)

    def test_description_defaults_to_empty(self):
        deadline = self.create_deadline()
        self.assertEqual(deadline.description, '')

    def test_all_types_valid(self):
        for t in ['exam', 'coursework', 'quiz', 'presentation']:
            self.create_deadline(deadline_type=t)
        self.assertEqual(Deadline.objects.count(), 4)
    
    def test_deadline_deleted_with_module(self):
        self.create_deadline()
        self.module.delete()
        self.assertEqual(Deadline.objects.count(), 0)

    def test_str_representation(self):
        deadline = self.create_deadline(title='Essay')
        self.assertIn('5CCS2SEG', str(deadline))
        self.assertIn('Essay', str(deadline))
