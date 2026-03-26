"""
Backend tests for society tag, announcement, ratification, sync, and publish views.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from studyFlax.models.society.society_model import Society
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.models.society.society_announcement_model import SocietyAnnouncement
from studyFlax.tests.helpers.test_model_builders import (
    make_society, make_society_admin, make_society_member,
)


User = get_user_model()

class SocietyTagViewExtendedTest(TestCase):
    """Tests society tag view extended."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='stag_admin', email='stag_admin@e.com', password='pass')
        self.other = User.objects.create_user(username='stag_other', email='stag_other@e.com', password='pass')
        self.society = make_society('Tag View Society')
        make_society_admin(self.admin, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_update_tag(self):
        from studyFlax.models.society.society_tag_model import SocietyTag
        tag = SocietyTag.objects.create(society=self.society, label='Old', color='#000')
        response = self.client.patch(
            f'/api/societies/{self.society.id}/tags/{tag.id}/',
            {'label': 'New', 'color': '#fff'},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['label'], 'New')

    def test_update_tag_invalid(self):
        from studyFlax.models.society.society_tag_model import SocietyTag
        tag = SocietyTag.objects.create(society=self.society, label='Old', color='#000')
        response = self.client.patch(f'/api/societies/{self.society.id}/tags/{tag.id}/', {'label': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_tag_non_admin(self):
        from studyFlax.models.society.society_tag_model import SocietyTag
        tag = SocietyTag.objects.create(society=self.society, label='Tag', color='#000')
        self.client.force_authenticate(user=self.other)
        response = self.client.patch(f'/api/societies/{self.society.id}/tags/{tag.id}/', {'label': 'Hack'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_tag_exceeds_max(self):
        from studyFlax.models.society.society_tag_model import SocietyTag
        for index in range(7):
            SocietyTag.objects.create(society=self.society, label=f'Tag{index}', color='#000')
        response = self.client.post(
            f'/api/societies/{self.society.id}/tags/',
            {'label': 'Extra', 'color': '#fff'},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Maximum', response.data['error'])

    def test_delete_tag_nonexistent_society(self):
        response = self.client.delete('/api/societies/99999/tags/1/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class SocietySerializerEdgeCaseTest(TestCase):
    """Tests society serialiser edge case."""
    def test_profile_photo_url_with_request_and_photo(self):
        from unittest.mock import MagicMock, PropertyMock, patch
        from rest_framework.test import APIRequestFactory
        from studyFlax.serialisers.society.society_serialisers import SocietyMembershipSerialiser
        user = User.objects.create_user(username='mphoto', email='mphoto@test.com', password='pass')
        society = Society.objects.create(name='PhotoSoc', bio='b', admin_emails='a@b.com')
        membership = SocietyMembership.objects.create(user=user, society=society, role='member')
        request = APIRequestFactory().get('/')
        request.user = user
        mock_photo = MagicMock()
        mock_photo.url = '/media/profile_photos/test.jpg'
        mock_photo.__bool__ = lambda self: True
        with patch.object(type(user), 'profile_photo', new_callable=PropertyMock, return_value=mock_photo):
            serializer = SocietyMembershipSerialiser(membership, context={'request': request})
            profile_photo_url = serializer.data['profile_photo_url']
        self.assertIn('/media/profile_photos/test.jpg', profile_photo_url)

    def test_has_reported_false_without_request(self):
        from studyFlax.serialisers.society.society_serialisers import SocietyDetailSerialiser
        society = Society.objects.create(name='NoReqSoc', bio='b', admin_emails='a@b.com')
        serializer = SocietyDetailSerialiser(society)
        self.assertFalse(serializer.data['has_reported'])

class SocietyAnnouncementViewTest(TestCase):
    """Tests society announcement view."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
        self.member = User.objects.create_user(username='member', email='member@example.com', password='pass')
        self.society = make_society()
        make_society_admin(self.admin, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_get_announcements(self):
        response = self.client.get(f'/api/societies/{self.society.id}/announcements/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_announcement(self):
        response = self.client.post(f'/api/societies/{self.society.id}/announcements/', {'title': 'Hello', 'content': 'World'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_announcement_as_non_admin(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(f'/api/societies/{self.society.id}/announcements/', {'title': 'Hi', 'content': 'There'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_announcement_detail(self):
        ann = SocietyAnnouncement.objects.create(society=self.society, title='Hi', content='There')
        response = self.client.get(f'/api/societies/{self.society.id}/announcements/{ann.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_announcement(self):
        ann = SocietyAnnouncement.objects.create(society=self.society, title='Hi', content='There')
        response = self.client.delete(f'/api/societies/{self.society.id}/announcements/{ann.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_announcement_not_found(self):
        response = self.client.get(f'/api/societies/{self.society.id}/announcements/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_society_not_found(self):
        response = self.client.get('/api/societies/99999/announcements/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class SocietyTagViewTest(TestCase):
    """Tests society tag view."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
        self.other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        self.society = make_society()
        make_society_admin(self.admin, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_get_tags(self):
        response = self.client.get(f'/api/societies/{self.society.id}/tags/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_tag(self):
        response = self.client.post(f'/api/societies/{self.society.id}/tags/', {'label': 'Sports', 'color': '#FF0000'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_tag_non_admin(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.post(f'/api/societies/{self.society.id}/tags/', {'name': 'Sports'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_tag(self):
        from studyFlax.models.society.society_tag_model import SocietyTag
        tag = SocietyTag.objects.create(society=self.society, label='Sports', color='#FF0000')
        response = self.client.delete(f'/api/societies/{self.society.id}/tags/{tag.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_tag_not_found(self):
        response = self.client.delete(f'/api/societies/{self.society.id}/tags/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class RatificationViewTest(TestCase):
    """Tests ratification view."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
        self.superuser = User.objects.create_superuser(username='super', email='super@example.com', password='pass')
        self.society = make_society()
        make_society_admin(self.admin, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_request_ratification(self):
        response = self.client.post(f'/api/societies/{self.society.id}/ratification/request/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'pending')

    def test_request_ratification_already_pending(self):
        self.society.ratification_status = 'pending'
        self.society.save()
        response = self.client.post(f'/api/societies/{self.society.id}/ratification/request/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approve_ratification_as_superuser(self):
        self.society.ratification_status = 'pending'
        self.society.save()
        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(f'/api/societies/{self.society.id}/ratification/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_reject_ratification_as_superuser(self):
        self.society.ratification_status = 'pending'
        self.society.save()
        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(f'/api/societies/{self.society.id}/ratification/reject/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_approve_non_pending(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.post(f'/api/societies/{self.society.id}/ratification/approve/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pending_ratifications_list(self):
        self.society.ratification_status = 'pending'
        self.society.save()
        self.client.force_authenticate(user=self.superuser)
        response = self.client.get('/api/admin/societies/pending-ratifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_request_ratification_non_admin(self):
        other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        self.client.force_authenticate(user=other)
        response = self.client.post(f'/api/societies/{self.society.id}/ratification/request/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

class CalendarSyncViewTest(TestCase):
    """Tests calendar sync view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='user', email='user@example.com', password='pass')
        self.society = make_society()
        make_society_member(self.user, self.society)
        self.client.force_authenticate(user=self.user)

    def test_sync_status_not_synced(self):
        response = self.client.get(f'/api/societies/{self.society.id}/calendar-sync-status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_synced'])

    def test_sync_calendar(self):
        response = self.client.post(f'/api/societies/{self.society.id}/calendar-sync/')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertTrue(response.data['is_synced'])

    def test_sync_calendar_not_member(self):
        other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        self.client.force_authenticate(user=other)
        response = self.client.post(f'/api/societies/{self.society.id}/calendar-sync/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unsync_calendar(self):
        self.client.post(f'/api/societies/{self.society.id}/calendar-sync/')
        response = self.client.delete(f'/api/societies/{self.society.id}/calendar-unsync/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_synced'])

    def test_society_not_found(self):
        response = self.client.get('/api/societies/99999/calendar-sync-status/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class PublishChangesViewTest(TestCase):
    """Tests publish changes view."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
        self.other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        self.society = make_society()
        make_society_admin(self.admin, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_publish_changes(self):
        response = self.client.post(f'/api/societies/{self.society.id}/publish/', {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_publish_non_admin(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.post(f'/api/societies/{self.society.id}/publish/', {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_publish_society_not_found(self):
        response = self.client.post('/api/societies/99999/publish/', {})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
