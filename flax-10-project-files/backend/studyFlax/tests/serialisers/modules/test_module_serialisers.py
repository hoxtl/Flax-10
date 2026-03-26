"""
Tests for module serialiser exception branches.
"""

from unittest.mock import MagicMock, PropertyMock

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from studyFlax.tests.helpers.test_model_builders import make_user


class ModuleSerialiserExceptionBranchTest(TestCase):
    """Tests for get_created_by_name and get_created_by_email exception paths."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.teacher = make_user('mod_ser_teacher', 'mod_ser_teacher@e.com')
        self.teacher.role = 'teacher'
        self.teacher.save()

    def test_get_created_by_name_returns_unknown_on_exception(self):
        from studyFlax.serialisers.modules.module_serialisers import ModuleSerialiser
        obj = MagicMock()
        type(obj).created_by = PropertyMock(side_effect=Exception('broken'))
        serialiser = ModuleSerialiser()
        result = serialiser.get_created_by_name(obj)
        self.assertEqual(result, 'Unknown')

    def test_get_created_by_email_returns_none_on_exception(self):
        from studyFlax.serialisers.modules.module_serialisers import ModuleSerialiser
        obj = MagicMock()
        type(obj).created_by = PropertyMock(side_effect=Exception('broken'))
        serialiser = ModuleSerialiser()
        result = serialiser.get_created_by_email(obj)
        self.assertIsNone(result)

    def test_get_profile_photo_url_with_photo_and_request(self):
        from studyFlax.serialisers.modules.module_serialisers import ModuleSerialiser
        obj = MagicMock()
        obj.created_by.profile_photo.url = '/media/photo.jpg'
        request = self.factory.get('/')
        serialiser = ModuleSerialiser(context={'request': request})
        result = serialiser.get_created_by_profile_photo_url(obj)
        self.assertIn('/media/photo.jpg', result)
