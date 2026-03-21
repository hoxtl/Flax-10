"""
Backend tests for society announcement views extended.
"""

from datetime import timedelta

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APIRequestFactory

from studyFlax.models.society.society_model import Society
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.models.society.society_announcement_model import SocietyAnnouncement, SocietyAnnouncementImage
from studyFlax.models.society.society_tag_model import SocietyTag
<<<<<<< HEAD
from studyFlax.tests.helpers.test_model_builders import (
    make_announcement, make_society, make_society_admin, make_society_member,
)

=======
from studyFlax.tests.helpers.factories import (
    make_announcement, make_society, make_society_admin, make_society_member,
)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

User = get_user_model()

class AnnouncementCreateExtendedTest(TestCase):
    """Tests for announcement create extended."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='ann_admin', email='annadmin@e.com', password='pass')
        self.member = User.objects.create_user(username='ann_member', email='annmember@e.com', password='pass')
        self.society = make_society()
        make_society_admin(self.admin, self.society)
        make_society_member(self.member, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_create_announcement_with_images(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/announcements/',
            {
                'title': 'With Images',
                'content': 'Check these out',
                'image_urls': ['http://example.com/img1.jpg', 'http://example.com/img2.jpg']
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ann = SocietyAnnouncement.objects.get(title='With Images')
        self.assertEqual(SocietyAnnouncementImage.objects.filter(announcement=ann).count(), 2)

    def test_create_announcement_with_images_key(self):
<<<<<<< HEAD
=======
        """Verify that sending 'images' instead of 'image_urls' also works."""
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        response = self.client.post(
            f'/api/societies/{self.society.id}/announcements/',
            {
                'title': 'With Images Key',
                'content': 'Check these out',
                'images': ['http://example.com/img3.jpg']
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ann = SocietyAnnouncement.objects.get(title='With Images Key')
        self.assertEqual(SocietyAnnouncementImage.objects.filter(announcement=ann).count(), 1)
        self.assertEqual(ann.images.first().url, 'http://example.com/img3.jpg')

    def test_create_announcement_invalid(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/announcements/', {}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_announcement_silent(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/announcements/?silent=true',
            {'title': 'Silent', 'content': 'No notify'}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_announcement_non_admin(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            f'/api/societies/{self.society.id}/announcements/',
            {'title': 'Hack', 'content': 'No'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_announcement_nonexistent_society(self):
        response = self.client.post(
            '/api/societies/99999/announcements/',
            {'title': 'X', 'content': 'Y'}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class AnnouncementDetailExtendedTest(TestCase):
    """Tests for announcement detail extended."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='anndet_admin', email='anndetadmin@e.com', password='pass')
        self.member = User.objects.create_user(username='anndet_member', email='anndetmember@e.com', password='pass')
        self.society = make_society('Detail Society')
        make_society_admin(self.admin, self.society)
        make_society_member(self.member, self.society)
        self.client.force_authenticate(user=self.admin)
        self.ann = make_announcement(self.society)

    def test_patch_announcement(self):
        response = self.client.patch(
            f'/api/societies/{self.society.id}/announcements/{self.ann.id}/',
            {'title': 'Updated', 'content': 'New content'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated')

    def test_patch_announcement_invalid(self):
        response = self.client.patch(
            f'/api/societies/{self.society.id}/announcements/{self.ann.id}/',
            {'title': ''}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_announcement_update_images(self):
        SocietyAnnouncementImage.objects.create(announcement=self.ann, url='http://old.jpg', order=0)
        response = self.client.patch(
            f'/api/societies/{self.society.id}/announcements/{self.ann.id}/',
            {
                'title': 'With New Images',
                'image_urls': ['http://new.jpg']
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        images = SocietyAnnouncementImage.objects.filter(announcement=self.ann)
        self.assertEqual(images.count(), 1)
        self.assertEqual(images.first().url, 'http://new.jpg')

    def test_patch_announcement_as_non_admin(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.patch(
            f'/api/societies/{self.society.id}/announcements/{self.ann.id}/',
            {'title': 'Hack'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_announcement_as_non_admin(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.delete(
            f'/api/societies/{self.society.id}/announcements/{self.ann.id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_announcement_silent(self):
        response = self.client.delete(
            f'/api/societies/{self.society.id}/announcements/{self.ann.id}/?silent=true'
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SocietyAnnouncement.objects.filter(id=self.ann.id).exists())

    def test_announcement_detail_nonexistent_society(self):
        response = self.client.get(
            f'/api/societies/99999/announcements/{self.ann.id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_announcement_detail_nonexistent_announcement(self):
        response = self.client.get(
            f'/api/societies/{self.society.id}/announcements/99999/'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_announcement_nonexistent_society(self):
        response = self.client.patch(
            f'/api/societies/99999/announcements/{self.ann.id}/',
            {'title': 'X'}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_society_invalid_data(self):
        response = self.client.patch(
            f'/api/societies/{self.society.id}/',
            {'name': ''},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class SocietyViewCoverageTest(TestCase):
    """Tests for society view branches not yet covered."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='sv_admin', email='sv_admin@test.com', password='pass'
        )
        self.other = User.objects.create_user(
            username='sv_other', email='sv_other@test.com', password='pass'
        )
        self.society = Society.objects.create(
            name='SVSociety', bio='bio', admin_emails='admin@test.com'
        )
        SocietyMembership.objects.create(user=self.admin, society=self.society, role='admin')
        self.client.force_authenticate(user=self.admin)

    def test_publish_changes_announcement_only_url(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/publish/',
            {'announcements_added': ['New Post']},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_society_tag_list_not_found(self):
        response = self.client.get('/api/societies/99999/tags/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_society_tag_create_invalid_data(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/tags/', {}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ratification_request_society_not_found(self):
        response = self.client.post('/api/societies/99999/ratification/request/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_ratification_decision_society_not_found(self):
        superuser = User.objects.create_superuser(
            username='sv_super', email='sv_super@test.com', password='pass'
        )
        self.client.force_authenticate(user=superuser)
        response = self.client.post('/api/societies/99999/ratification/approve/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_sync_calendar_society_not_found(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.post('/api/societies/99999/calendar-sync/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unsync_calendar_society_not_found(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.delete('/api/societies/99999/calendar-unsync/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class SocietySerializerCoverageTest(TestCase):
    """Tests for society serializer branches not yet covered."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(username='serializer_cov', email='serializer_cov@example.com', password='pass')
        self.society = Society.objects.create(name='Serializer Cov', bio='bio', admin_emails='admin@example.com')

    def test_list_serializer_uses_image_field_before_related_images(self):
        from studyFlax.serialisers.society.society_serialisers import SocietyListSerialiser
        self.society.image = 'https://example.com/direct.jpg'
        self.society.save()
        SocietyTag.objects.create(society=self.society, label='General', color='#123456')
        request = self.factory.get('/')
        request.user = self.user
        serializer = SocietyListSerialiser(self.society, context={'request': request})
        self.assertEqual(serializer.data['cover_image'], 'https://example.com/direct.jpg')

    def _make_announcement_serialiser(self):
        from studyFlax.serialisers.society.society_serialisers import SocietyAnnouncementSerialiser
        return SocietyAnnouncementSerialiser

    def test_announcement_serializer_event_id(self):
        from studyFlax.models.society.society_event_model import SocietyEvent
        Serialiser = self._make_announcement_serialiser()
        announcement = SocietyAnnouncement.objects.create(society=self.society, title='Title', content='Content')
        event = SocietyEvent.objects.create(
            society=self.society, title='Linked', start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1), recurrence='none',
            announcement=announcement,
        )
        serializer = Serialiser(announcement, context={'skip_notification': True})
        self.assertEqual(serializer.data['event_id'], event.id)

    def test_announcement_serializer_create(self):
        Serialiser = self._make_announcement_serialiser()
        create_serializer = Serialiser(
            data={'title': 'Created', 'content': 'Body'},
            context={'skip_notification': True},
        )
        self.assertTrue(create_serializer.is_valid(), create_serializer.errors)
        created = create_serializer.save(society=self.society)
        self.assertTrue(getattr(created, '_skip_notification', False))

    def test_announcement_serializer_update(self):
        Serialiser = self._make_announcement_serialiser()
        announcement = SocietyAnnouncement.objects.create(society=self.society, title='Original', content='Body')
        update_serializer = Serialiser(
            announcement, data={'content': 'Updated'}, partial=True,
            context={'skip_notification': True},
        )
        self.assertTrue(update_serializer.is_valid(), update_serializer.errors)
        updated = update_serializer.save()
        self.assertTrue(getattr(updated, '_skip_notification', False))

    def test_event_calendar_serializer_color_and_source(self):
        from studyFlax.serialisers.society.society_serialisers import SocietyEventCalendarSerialiser
        announcement = SocietyAnnouncement.objects.create(society=self.society, title='Announcement', content='Body')
        event = self.society.events.create(
            title='Event',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
            recurrence='none',
            announcement=announcement,
        )
        serializer = SocietyEventCalendarSerialiser(event)
        self.assertEqual(serializer.data['source'], 'society')
        self.assertTrue(serializer.data['society_color'].startswith('#'))
