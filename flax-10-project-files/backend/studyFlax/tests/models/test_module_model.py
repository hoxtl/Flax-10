from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from django.db import IntegrityError
from studyFlax.models.auth.userModel import User
from studyFlax.models.modules.moduleModel import Module


class ModuleModelTests(TestCase):
    """ Test suite for Module model."""
    def setUp(self):
        """ Set up test data. """
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
        """ Test a module can be created with required fields."""
        module = self.make_module()
        self.assertIsInstance(module, Module)

    def test_duplicate_code_fails(self):
        """ Test that duplicate module codes are not allowed."""
        self.make_module()
        with self.assertRaises(IntegrityError):
            self.make_module()

    def test_optional_fields_default_to_none(self):
        """ Test that location and recurrence rule fields default to None"""
        module = self.make_module()
        self.assertIsNone(module.location)
        self.assertIsNone(module.recurrence_rule)

    def test_deleted_with_teacher(self):
        """ Test that modules are deleted alongside the teacher that created them."""
        self.make_module()
        self.teacher.delete()
        self.assertEqual(Module.objects.count(), 0)

    def test_str_representation(self):
        module = self.make_module()
        self.assertEqual(str(module), '5CCS2SEG')