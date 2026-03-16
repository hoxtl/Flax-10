"""
Backend tests for society list, detail, membership, report, subscription, and event views.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyMembershipModel import SocietyMembership
from studyFlax.models.society.societyEventModel import SocietyEvent

User = get_user_model()

def make_society(name='Test Society'):
    return Society.objects.create(name=name, bio='Test', admin_emails='admin@test.com')

def make_admin(user, society):
    return SocietyMembership.objects.create(user=user, society=society, role='admin')

def make_member(user, society):
    return SocietyMembership.objects.create(user=user, society=society, role='member')

class SocietyListViewTest(TestCase):
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

    def test_teacher_cannot_join_society(self):
        teacher = User.objects.create_user(
            username='teacher_user',
            email='teacher@test.com',
            password='pass',
            role='teacher',
        )
        self.client.force_authenticate(user=teacher)
        response = self.client.post(f'/api/societies/{self.society.id}/members/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Teachers cannot join societies.')

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

    def test_add_collaborator_teacher_blocked(self):
        teacher = User.objects.create_user(
            username='teacher_collab',
            email='teacher.collab@test.com',
            password='pass',
            role='teacher',
        )
        response = self.client.post(
            f'/api/societies/{self.society.id}/members/',
            {'username': teacher.username}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Teachers cannot join societies.')

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
