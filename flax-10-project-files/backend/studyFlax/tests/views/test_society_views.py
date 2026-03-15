"""
Backend tests for society views.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyMembershipModel import SocietyMembership
from studyFlax.models.society.societyEventModel import SocietyEvent
from studyFlax.models.society.societyAnnouncementModel import SocietyAnnouncement

User = get_user_model()


def make_society(name='Test Society', created_by=None):
    return Society.objects.create(name=name, bio='Test', admin_emails='admin@test.com')


def make_admin(user, society):
    return SocietyMembership.objects.create(user=user, society=society, role='admin')


def make_member(user, society):
    return SocietyMembership.objects.create(user=user, society=society, role='member')


class SocietyListViewTest(TestCase):
    """Tests for society list view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_get_societies(self):
        make_society()
        response = self.client.get('/api/societies/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_society(self):
        response = self.client.post('/api/societies/', {'name': 'New Society', 'description': 'Desc'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_society_invalid(self):
        response = self.client.post('/api/societies/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_society_sets_admin_membership(self):
        self.client.post('/api/societies/', {'name': 'My Society', 'description': 'Desc'})
        society = Society.objects.get(name='My Society')
        self.assertTrue(SocietyMembership.objects.filter(user=self.user, society=society).exists())


class SocietyDetailViewTest(TestCase):
    """Tests for society detail view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
        self.other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        self.society = make_society()
        make_admin(self.user, self.society)
        self.client.force_authenticate(user=self.user)

    def test_get_society_detail(self):
        response = self.client.get(f'/api/societies/{self.society.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_admin'])

    def test_get_society_not_found(self):
        response = self.client.get('/api/societies/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_society_as_admin(self):
        response = self.client.patch(f'/api/societies/{self.society.id}/', {'description': 'Updated'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_society_as_non_admin(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.patch(f'/api/societies/{self.society.id}/', {'description': 'Hack'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_society_as_admin(self):
        response = self.client.delete(f'/api/societies/{self.society.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_society_as_non_admin(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.delete(f'/api/societies/{self.society.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_society_detail_non_member(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.get(f'/api/societies/{self.society.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_member'])


class MembershipViewTest(TestCase):
    """Tests for membership view."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
        self.member = User.objects.create_user(username='member', email='member@example.com', password='pass')
        self.other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        self.society = make_society()
        make_admin(self.admin, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_get_members(self):
        response = self.client.get(f'/api/societies/{self.society.id}/members/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_join_society(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.post(f'/api/societies/{self.society.id}/members/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_join_already_member(self):
        make_member(self.member, self.society)
        self.client.force_authenticate(user=self.member)
        response = self.client.post(f'/api/societies/{self.society.id}/members/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_collaborator_by_username(self):
        response = self.client.post(f'/api/societies/{self.society.id}/members/', {'username': 'other'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_add_collaborator_by_email(self):
        response = self.client.post(f'/api/societies/{self.society.id}/members/', {'email': 'other@example.com'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_add_collaborator_not_found(self):
        response = self.client.post(f'/api/societies/{self.society.id}/members/', {'username': 'nobody'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_collaborator_non_admin(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.post(f'/api/societies/{self.society.id}/members/', {'username': 'member'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_leave_society(self):
        make_member(self.member, self.society)
        self.client.force_authenticate(user=self.member)
        response = self.client.delete(f'/api/societies/{self.society.id}/members/me/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_remove_member_as_admin(self):
        make_member(self.member, self.society)
        response = self.client.delete(f'/api/societies/{self.society.id}/members/{self.member.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_remove_non_member(self):
        response = self.client.delete(f'/api/societies/{self.society.id}/members/{self.other.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_role(self):
        make_member(self.member, self.society)
        response = self.client.patch(f'/api/societies/{self.society.id}/members/{self.member.id}/', {'role': 'editor'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_society_not_found(self):
        response = self.client.get('/api/societies/99999/members/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ReportSocietyViewTest(TestCase):
    """Tests for report society view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='reporter', email='r@test.com', password='pass')
        self.superadmin = User.objects.create_superuser(username='superadmin', email='sa@test.com', password='pass')
        self.society = make_society()
        self.client.force_authenticate(user=self.user)
        self.url = f'/api/societies/{self.society.id}/report/'

    def test_report_society_not_found(self):
        response = self.client.post('/api/societies/99999/report/', {'reason': 'spam'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_report_society_missing_reason(self):
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_report_society_blank_reason(self):
        response = self.client.post(self.url, {'reason': '   '})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_report_society_success_notifies_admins(self):
        response = self.client.post(self.url, {'reason': 'Spam content'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        from studyFlax.models.society.societyReportModel import SocietyReport
        self.assertTrue(SocietyReport.objects.filter(society=self.society, reporter=self.user).exists())

    def test_report_society_success_no_admins(self):
        self.superadmin.delete()
        response = self.client.post(self.url, {'reason': 'Spam'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_remove_report_success(self):
        from studyFlax.models.society.societyReportModel import SocietyReport
        SocietyReport.objects.create(society=self.society, reporter=self.user, reason='test')
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(SocietyReport.objects.filter(society=self.society, reporter=self.user).exists())

    def test_remove_report_not_found_society(self):
        response = self.client.delete('/api/societies/99999/report/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ToggleSubscriptionViewTest(TestCase):
    """Tests for toggle subscription view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='subuser', email='sub@test.com', password='pass')
        self.society = make_society()
        self.client.force_authenticate(user=self.user)
        self.url = f'/api/societies/{self.society.id}/subscribe/'

    def test_toggle_not_found_society(self):
        response = self.client.patch('/api/societies/99999/subscribe/', {'is_subscribed': True})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_toggle_not_a_member(self):
        response = self.client.patch(self.url, {'is_subscribed': True})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_toggle_subscription_on(self):
        membership = make_member(self.user, self.society)
        membership.is_subscribed = False
        membership.save()
        response = self.client.patch(self.url, {'is_subscribed': True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_subscribed'])

    def test_toggle_subscription_off(self):
        membership = make_member(self.user, self.society)
        membership.is_subscribed = True
        membership.save()
        response = self.client.patch(self.url, {'is_subscribed': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_subscribed'])

    def test_toggle_subscription_default_flips(self):
        membership = make_member(self.user, self.society)
        original = membership.is_subscribed
        response = self.client.patch(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['is_subscribed'], not original)


class SocietyEventViewTest(TestCase):
    """Tests for society event view."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
        self.member = User.objects.create_user(username='member', email='member@example.com', password='pass')
        self.society = make_society()
        make_admin(self.admin, self.society)
        make_member(self.member, self.society)
        self.client.force_authenticate(user=self.admin)
        self.event_data = {
            'title': 'Test Event',
            'start_time': (timezone.now() + timezone.timedelta(days=1)).isoformat(),
            'end_time': (timezone.now() + timezone.timedelta(days=1, hours=2)).isoformat(),
            'recurrence': 'none',
        }

    def test_get_events(self):
        response = self.client.get(f'/api/societies/{self.society.id}/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_event_as_admin(self):
        response = self.client.post(f'/api/societies/{self.society.id}/events/', self.event_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_event_as_member(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(f'/api/societies/{self.society.id}/events/', self.event_data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_event_detail(self):
        event = SocietyEvent.objects.create(society=self.society, **{
            'title': 'Test', 'recurrence': 'none',
            'start_time': timezone.now() + timezone.timedelta(days=1),
            'end_time': timezone.now() + timezone.timedelta(days=1, hours=2),
        })
        response = self.client.get(f'/api/societies/{self.society.id}/events/{event.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_event_as_admin(self):
        event = SocietyEvent.objects.create(society=self.society, **{
            'title': 'Test', 'recurrence': 'none',
            'start_time': timezone.now() + timezone.timedelta(days=1),
            'end_time': timezone.now() + timezone.timedelta(days=1, hours=2),
        })
        response = self.client.delete(f'/api/societies/{self.society.id}/events/{event.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_event_not_found(self):
        response = self.client.get(f'/api/societies/{self.society.id}/events/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_society_not_found(self):
        response = self.client.get('/api/societies/99999/events/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class SocietyTagViewExtendedTest(TestCase):
    """Tests for society tag view extended."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='stag_admin', email='stag_admin@e.com', password='pass')
        self.other = User.objects.create_user(username='stag_other', email='stag_other@e.com', password='pass')
        self.society = make_society('Tag View Society')
        make_admin(self.admin, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_update_tag(self):
        from studyFlax.models.society.societyTagModel import SocietyTag

        tag = SocietyTag.objects.create(society=self.society, label='Old', color='#000')
        response = self.client.patch(
            f'/api/societies/{self.society.id}/tags/{tag.id}/',
            {'label': 'New', 'color': '#fff'},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['label'], 'New')

    def test_update_tag_invalid(self):
        from studyFlax.models.society.societyTagModel import SocietyTag

        tag = SocietyTag.objects.create(society=self.society, label='Old', color='#000')
        response = self.client.patch(f'/api/societies/{self.society.id}/tags/{tag.id}/', {'label': ''})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_tag_non_admin(self):
        from studyFlax.models.society.societyTagModel import SocietyTag

        tag = SocietyTag.objects.create(society=self.society, label='Tag', color='#000')
        self.client.force_authenticate(user=self.other)
        response = self.client.patch(f'/api/societies/{self.society.id}/tags/{tag.id}/', {'label': 'Hack'})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_tag_exceeds_max(self):
        from studyFlax.models.society.societyTagModel import SocietyTag

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
    """Tests for society serializer edge case."""
    def test_profile_photo_url_with_request_and_photo(self):
        from unittest.mock import MagicMock, PropertyMock, patch
        from rest_framework.test import APIRequestFactory
        from studyFlax.serialisers.society_serialisers import SocietyMembershipSerialiser

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
        from studyFlax.serialisers.society_serialisers import SocietyDetailSerialiser

        society = Society.objects.create(name='NoReqSoc', bio='b', admin_emails='a@b.com')
        serializer = SocietyDetailSerialiser(society)

        self.assertFalse(serializer.data['has_reported'])


class SocietyAnnouncementViewTest(TestCase):
    """Tests for society announcement view."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
        self.member = User.objects.create_user(username='member', email='member@example.com', password='pass')
        self.society = make_society()
        make_admin(self.admin, self.society)
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
    """Tests for society tag view."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
        self.other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        self.society = make_society()
        make_admin(self.admin, self.society)
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
        from studyFlax.models.society.societyTagModel import SocietyTag
        tag = SocietyTag.objects.create(society=self.society, label='Sports', color='#FF0000')
        response = self.client.delete(f'/api/societies/{self.society.id}/tags/{tag.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_tag_not_found(self):
        response = self.client.delete(f'/api/societies/{self.society.id}/tags/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class RatificationViewTest(TestCase):
    """Tests for ratification view."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
        self.superuser = User.objects.create_superuser(username='super', email='super@example.com', password='pass')
        self.society = make_society()
        make_admin(self.admin, self.society)
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
    """Tests for calendar sync view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='user', email='user@example.com', password='pass')
        self.society = make_society()
        make_member(self.user, self.society)
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
    """Tests for publish changes view."""
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
        self.other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        self.society = make_society()
        make_admin(self.admin, self.society)
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
