"""
Backend tests for social views.
"""

from unittest.mock import MagicMock, PropertyMock, patch

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory

from studyFlax.models.calendar.categoryModel import Category
from studyFlax.models.social.shareModel import CalendarShare
from studyFlax.serialisers.social.social_serialisers import (
    CalendarShareSerialiser,
    CalendarShareUserSerialiser,
)

User = get_user_model()

class CalendarShareViewTests(APITestCase):

    """Tests for calendar share view."""
    def setUp(self):
        self.user1 = User.objects.create_user(username="user1", email="user1@example.com", password="password", first_name="User", last_name="One")
        self.user2 = User.objects.create_user(username="user2", email="user2@example.com", password="password", first_name="User", last_name="Two")
        self.user3 = User.objects.create_user(username="user3", email="user3@example.com", password="password")
        self.client.force_authenticate(user=self.user1)

    def test_share_calendar(self):
        url = f"/api/social/{self.user2.id}/share/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CalendarShare.objects.count(), 1)
        self.assertTrue(CalendarShare.objects.filter(owner=self.user1, shared_with=self.user2).exists())

    def test_share_self(self):
        url = f"/api/social/{self.user1.id}/share/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(CalendarShare.objects.count(), 0)

    def test_share_already_sharing(self):
        CalendarShare.objects.create(owner=self.user1, shared_with=self.user2)
        url = f"/api/social/{self.user2.id}/share/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(CalendarShare.objects.count(), 1)

    def test_unshare_calendar(self):
        CalendarShare.objects.create(owner=self.user1, shared_with=self.user2)
        url = f"/api/social/{self.user2.id}/unshare/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CalendarShare.objects.count(), 0)

    def test_unshare_not_sharing(self):
        url = f"/api/social/{self.user2.id}/unshare/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_sharing_with(self):
        CalendarShare.objects.create(owner=self.user2, shared_with=self.user1)
        CalendarShare.objects.create(owner=self.user2, shared_with=self.user3)

        url = f"/api/social/{self.user2.id}/sharing-with/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        self.assertEqual(len(results), 2)
        shared_with_ids = [u['id'] for u in results]
        self.assertIn(self.user1.id, shared_with_ids)
        self.assertIn(self.user3.id, shared_with_ids)

    def test_get_shared_with_me(self):
        CalendarShare.objects.create(owner=self.user2, shared_with=self.user1)
        CalendarShare.objects.create(owner=self.user3, shared_with=self.user1)

        url = f"/api/social/{self.user1.id}/shared-with-me/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        self.assertEqual(len(results), 2)
        shared_by_ids = [u['id'] for u in results]
        self.assertIn(self.user2.id, shared_by_ids)
        self.assertIn(self.user3.id, shared_by_ids)

    def test_share_user_not_found(self):
        url = "/api/social/99999/share/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unshare_user_not_found(self):
        url = "/api/social/99999/unshare/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_sharing_with_nonexistent_user(self):
        url = "/api/social/99999/sharing-with/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_shared_with_me_nonexistent_user(self):
        url = "/api/social/99999/shared-with-me/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class CalendarShareUserSerializerPhotoTest(APITestCase):
    """Tests for calendar share user serializer photo."""
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user1 = User.objects.create_user(username='share1', email='share1@example.com', password='pass', first_name='User', last_name='One')
        self.user2 = User.objects.create_user(username='share2', email='share2@example.com', password='pass', first_name='User', last_name='Two')
        self.user3 = User.objects.create_user(username='share3', email='share3@example.com', password='pass')

    def test_profile_photo_url_with_photo_and_request(self):
        user = User.objects.create_user(username='photoshare', email='ps@test.com', password='pass')
        mock_photo = MagicMock()
        mock_photo.url = '/media/profile_photos/share.jpg'
        mock_photo.__bool__ = lambda self: True

        request = self.factory.get('/')
        request.user = user

        with patch.object(type(user), 'profile_photo', new_callable=PropertyMock, return_value=mock_photo):
            serialiser = CalendarShareUserSerialiser(user, context={'request': request})
            url = serialiser.data['profile_photo_url']
        self.assertIn('/media/profile_photos/share.jpg', url)

    def test_profile_photo_url_with_photo_no_request(self):
        user = User.objects.create_user(username='photoshare2', email='ps2@test.com', password='pass')
        mock_photo = MagicMock()
        mock_photo.url = '/media/profile_photos/share2.jpg'
        mock_photo.__bool__ = lambda self: True

        with patch.object(type(user), 'profile_photo', new_callable=PropertyMock, return_value=mock_photo):
            serialiser = CalendarShareUserSerialiser(user)
            url = serialiser.data['profile_photo_url']
        self.assertIsNone(url)

    def test_flags_without_request_context(self):
        user = User.objects.create_user(username='flaguser', email='flags@test.com', password='pass')
        serialiser = CalendarShareUserSerialiser(user)
        self.assertIsNone(serialiser.data['profile_photo_url'])
        self.assertFalse(serialiser.data['is_sharing'])
        self.assertFalse(serialiser.data['is_shared_with_me'])

    def test_sharing_flags(self):
        CalendarShare.objects.create(owner=self.user1, shared_with=self.user2)
        CalendarShare.objects.create(owner=self.user2, shared_with=self.user3)

        request = self.factory.get('/')
        request.user = self.user1
        serialiser = CalendarShareUserSerialiser(self.user2, context={'request': request})
        self.assertTrue(serialiser.data['is_sharing'])

        request.user = self.user3
        serialiser = CalendarShareUserSerialiser(self.user2, context={'request': request})
        self.assertTrue(serialiser.data['is_shared_with_me'])

class CalendarShareSerializerTest(APITestCase):
    """Tests for calendar share serializer."""
    def setUp(self):
        self.owner = User.objects.create_user(username='social_owner', email='social_owner@e.com', password='pass')
        self.viewer = User.objects.create_user(username='social_viewer', email='social_viewer@e.com', password='pass')
        self.factory = APIRequestFactory()

    def test_calendar_share_serializer(self):
        share = CalendarShare.objects.create(owner=self.owner, shared_with=self.viewer)
        request = self.factory.get('/')
        request.user = self.owner

        serialiser = CalendarShareSerialiser(share, context={'request': request})

        self.assertIn('id', serialiser.data)

    def test_calendar_share_user_serializer(self):
        request = self.factory.get('/')
        request.user = self.viewer

        serialiser = CalendarShareUserSerialiser(self.owner, context={'request': request})

        self.assertIn('id', serialiser.data)
        self.assertIn('username', serialiser.data)

    def test_calendar_share_serializer_blocks_self_share(self):
        request = self.factory.get('/')
        request.user = self.owner
        serialiser = CalendarShareSerialiser(
            data={'shared_with': self.owner.id},
            context={'request': request}
        )
        self.assertFalse(serialiser.is_valid())
        self.assertIn('non_field_errors', serialiser.errors)

    def test_calendar_share_serializer_assigns_owner(self):
        request = self.factory.get('/')
        request.user = self.owner
        serialiser = CalendarShareSerialiser(
            data={'shared_with': self.viewer.id},
            context={'request': request}
        )
        self.assertTrue(serialiser.is_valid())
        share = serialiser.save()
        self.assertEqual(share.owner, self.owner)
        self.assertEqual(share.shared_with, self.viewer)

class SocialAndCategoryCoverageTest(TestCase):
    """Tests for CalendarShare __str__ and Category __str__ methods."""

    def test_calendar_share_string_and_category_string(self):
        owner = User.objects.create_user(username='owner_cov', email='owner_cov@example.com', password='pass')
        shared = User.objects.create_user(username='shared_cov', email='shared_cov@example.com', password='pass')
        share = CalendarShare.objects.create(owner=owner, shared_with=shared)
        category = Category.objects.create(name='Coverage Category', color='#abcdef', is_default=True)
        self.assertIn('shares with', str(share))
        self.assertEqual(str(category), 'Coverage Category')
