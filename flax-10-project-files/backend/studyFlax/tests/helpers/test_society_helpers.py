"""
Backend tests for society helpers.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory

from studyFlax.models.society.society_image_model import SocietyImage
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.models.society.society_model import Society
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

User = get_user_model()

def make_user(username='miscuser', email='misc@example.com'):
    return User.objects.create_user(username=username, email=email, password='pass')

def make_society(name='Misc Society'):
    return Society.objects.create(name=name, bio='Bio', admin_emails='a@test.com')

def make_member(user, society):
    return SocietyMembership.objects.create(user=user, society=society, role='member')

class SocietyHelpersTest(TestCase):
    """Tests for society helpers."""

    def setUp(self):
        self.user = make_user()
        self.society = make_society()
        self.factory = APIRequestFactory()

    def test_handle_image_urls_replaces_images(self):
        from studyFlax.views.society.helpers import handle_image_urls

        SocietyImage.objects.create(society=self.society, url='http://old.jpg', is_cover=True)
        handle_image_urls(self.society, {'image_urls': ['http://new1.jpg', 'http://new2.jpg']})

        images = SocietyImage.objects.filter(society=self.society)
        self.assertEqual(images.count(), 2)
        self.assertIn('http://new1.jpg', list(images.values_list('url', flat=True)))

    def test_handle_image_urls_uses_images_key(self):
        from studyFlax.views.society.helpers import handle_image_urls

        handle_image_urls(self.society, {'images': ['http://alt.jpg']})
        self.assertEqual(SocietyImage.objects.filter(society=self.society).count(), 1)

    def test_handle_image_urls_none_does_nothing(self):
        from studyFlax.views.society.helpers import handle_image_urls

        SocietyImage.objects.create(society=self.society, url='http://keep.jpg', is_cover=True)
        handle_image_urls(self.society, {})
        self.assertEqual(SocietyImage.objects.filter(society=self.society).count(), 1)

    def test_require_society_decorator(self):
        from rest_framework.response import Response
        from studyFlax.views.society.helpers import require_society

        called_with = {}

        def view_func(request, society, *args, **kwargs):
            called_with['society'] = society
            return Response({'ok': True})

        wrapped = require_society(view_func)
        request = self.factory.get('/')
        wrapped(request, self.society.id)

        self.assertEqual(called_with['society'], self.society)

    def test_require_society_decorator_not_found(self):
        from rest_framework.response import Response
        from studyFlax.views.society.helpers import require_society

        def view_func(request, society, *args, **kwargs):
            return Response({'ok': True})

        wrapped = require_society(view_func)
        request = self.factory.get('/')
        response = wrapped(request, 99999)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_is_society_member_false(self):
        from studyFlax.views.society.helpers import is_society_member

        non_member = make_user('nonmember_helper', 'nonmember_helper@e.com')
        self.assertFalse(is_society_member(non_member, self.society))

    def test_is_society_member_true(self):
        from studyFlax.views.society.helpers import is_society_member

        make_member(self.user, self.society)
        self.assertTrue(is_society_member(self.user, self.society))
