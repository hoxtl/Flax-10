"""
Backend tests for module model.
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from django.db import IntegrityError
from studyFlax.models.auth.user_model import User
from studyFlax.models.modules.module_model import Module
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

class ModuleModelTests(TestCase):
    """Test suite for Module model."""

    def setUp(self):
        self.teacher = User.objects.create_user(
            username='teacher', email='teacher@test.com',
            password='Password123', first_name='Teacher', last_name='Test', role='teacher'
        )

    def make_module(self, **kwargs):
        defaults = dict(
            module_code='5CCS2SEG', module_name='Software Engineering',
            created_by=self.teacher,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )
        defaults.update(kwargs)
        return Module.objects.create(**defaults)

    def test_module_creation(self):
        module = self.make_module()
        self.assertIsInstance(module, Module)

    def test_duplicate_code_fails(self):
        self.make_module()
        with self.assertRaises(IntegrityError):
            self.make_module()

    def test_optional_fields_default_to_none(self):
        module = self.make_module()
        self.assertIsNone(module.location)
        self.assertIsNone(module.recurrence_rule)

    def test_deleted_with_teacher(self):
        self.make_module()
        self.teacher.delete()
        self.assertEqual(Module.objects.count(), 0)

    def test_str_representation(self):
        module = self.make_module()
        self.assertEqual(str(module), '5CCS2SEG')
