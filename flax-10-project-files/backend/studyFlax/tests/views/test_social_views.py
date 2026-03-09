from unittest.mock import MagicMock, PropertyMock, patch

from rest_framework.test import APITestCase, APIRequestFactory
from rest_framework import status
from django.contrib.auth import get_user_model
from studyFlax.models.social.shareModel import CalendarShare
from studyFlax.serializers.socialSerializer import CalendarShareUserSerializer

User = get_user_model()

class CalendarShareViewTests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(username="user1", email="user1@example.com", password="password", first_name="User", last_name="One")
        self.user2 = User.objects.create_user(username="user2", email="user2@example.com", password="password", first_name="User", last_name="Two")
        self.user3 = User.objects.create_user(username="user3", email="user3@example.com", password="password")
        self.client.force_authenticate(user=self.user1)

    def test_share_calendar(self):
        """Test successfully sharing calendar with a user."""
        url = f"/api/social/{self.user2.id}/share/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CalendarShare.objects.count(), 1)
        self.assertTrue(CalendarShare.objects.filter(owner=self.user1, shared_with=self.user2).exists())

    def test_share_self(self):
        """Test preventing a user from sharing with themselves."""
        url = f"/api/social/{self.user1.id}/share/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(CalendarShare.objects.count(), 0)

    def test_share_already_sharing(self):
        """Test preventing duplicate shares."""
        CalendarShare.objects.create(owner=self.user1, shared_with=self.user2)
        url = f"/api/social/{self.user2.id}/share/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(CalendarShare.objects.count(), 1)

    def test_unshare_calendar(self):
        """Test successfully unsharing calendar from a user."""
        CalendarShare.objects.create(owner=self.user1, shared_with=self.user2)
        url = f"/api/social/{self.user2.id}/unshare/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CalendarShare.objects.count(), 0)

    def test_unshare_not_sharing(self):
        """Test trying to unshare from someone you don't share with."""
        url = f"/api/social/{self.user2.id}/unshare/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_sharing_with(self):
        """Test getting the list of users this user shares with."""
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
        """Test getting the list of calendars shared with this user."""
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


class CalendarShareUserSerializerPhotoTest(APITestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_profile_photo_url_with_photo_and_request(self):
        user = User.objects.create_user(username='photoshare', email='ps@test.com', password='pass')
        mock_photo = MagicMock()
        mock_photo.url = '/media/profile_photos/share.jpg'
        mock_photo.__bool__ = lambda self: True

        request = self.factory.get('/')
        request.user = user

        with patch.object(type(user), 'profile_photo', new_callable=PropertyMock, return_value=mock_photo):
            serializer = CalendarShareUserSerializer(user, context={'request': request})
            url = serializer.data['profile_photo_url']
        self.assertIn('/media/profile_photos/share.jpg', url)

    def test_profile_photo_url_with_photo_no_request(self):
        user = User.objects.create_user(username='photoshare2', email='ps2@test.com', password='pass')
        mock_photo = MagicMock()
        mock_photo.url = '/media/profile_photos/share2.jpg'
        mock_photo.__bool__ = lambda self: True

        with patch.object(type(user), 'profile_photo', new_callable=PropertyMock, return_value=mock_photo):
            serializer = CalendarShareUserSerializer(user)
            url = serializer.data['profile_photo_url']
        self.assertIsNone(url)
