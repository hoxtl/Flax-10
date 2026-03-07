from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone

from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyMembershipModel import SocietyMembership
from studyFlax.models.society.societyAnnouncementModel import SocietyAnnouncement, SocietyAnnouncementImage

User = get_user_model()


def make_society(name='Ann Society'):
    return Society.objects.create(name=name, bio='Bio', admin_emails='a@test.com')


def make_admin(user, society):
    return SocietyMembership.objects.create(user=user, society=society, role='admin')


def make_member(user, society):
    return SocietyMembership.objects.create(user=user, society=society, role='member')


def make_announcement(society, title='Announcement', content='Content'):
    return SocietyAnnouncement.objects.create(society=society, title=title, content=content)


class AnnouncementCreateExtendedTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='ann_admin', email='annadmin@e.com', password='pass')
        self.member = User.objects.create_user(username='ann_member', email='annmember@e.com', password='pass')
        self.society = make_society()
        make_admin(self.admin, self.society)
        make_member(self.member, self.society)
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
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='anndet_admin', email='anndetadmin@e.com', password='pass')
        self.member = User.objects.create_user(username='anndet_member', email='anndetmember@e.com', password='pass')
        self.society = make_society('Detail Society')
        make_admin(self.admin, self.society)
        make_member(self.member, self.society)
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
        # Old image deleted, new one added
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
