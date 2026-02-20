from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from studyFlax.models.social.followModel import Follow

User = get_user_model()

class FollowViewTests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(username="user1", email="user1@example.com", password="password")
        self.user2 = User.objects.create_user(username="user2", email="user2@example.com", password="password")
        self.user3 = User.objects.create_user(username="user3", email="user3@example.com", password="password")
        self.client.force_authenticate(user=self.user1)

    def test_follow_user(self):
        """Test successfully following a user."""
        url = f"/api/social/{self.user2.id}/follow/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Follow.objects.count(), 1)
        self.assertTrue(Follow.objects.filter(follower=self.user1, followed=self.user2).exists())

    def test_follow_self(self):
        """Test preventing a user from following themselves."""
        url = f"/api/social/{self.user1.id}/follow/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Follow.objects.count(), 0)

    def test_follow_already_following(self):
        """Test preventing duplicate follows."""
        Follow.objects.create(follower=self.user1, followed=self.user2)
        url = f"/api/social/{self.user2.id}/follow/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Follow.objects.count(), 1)

    def test_unfollow_user(self):
        """Test successfully unfollowing a user."""
        Follow.objects.create(follower=self.user1, followed=self.user2)
        url = f"/api/social/{self.user2.id}/unfollow/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Follow.objects.count(), 0)

    def test_unfollow_not_following(self):
        """Test trying to unfollow someone you don't follow."""
        url = f"/api/social/{self.user2.id}/unfollow/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_followers(self):
        """Test getting a user's followers list."""
        Follow.objects.create(follower=self.user1, followed=self.user2)
        Follow.objects.create(follower=self.user3, followed=self.user2)

        url = f"/api/social/{self.user2.id}/followers/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        self.assertEqual(len(results), 2)
        follower_ids = [u['id'] for u in results]
        self.assertIn(self.user1.id, follower_ids)
        self.assertIn(self.user3.id, follower_ids)

    def test_get_following(self):
        """Test getting a user's following list."""
        Follow.objects.create(follower=self.user1, followed=self.user2)
        Follow.objects.create(follower=self.user1, followed=self.user3)

        url = f"/api/social/{self.user1.id}/following/"
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if isinstance(response.data, dict) and 'results' in response.data else response.data
        self.assertEqual(len(results), 2)
        following_ids = [u['id'] for u in results]
        self.assertIn(self.user2.id, following_ids)
        self.assertIn(self.user3.id, following_ids)
