"""
Tests for admin management views: users, bans, teacher requests, societies.
"""

from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from studyFlax.models.notifications.notificationModel import Notification
from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyMembershipModel import SocietyMembership
from studyFlax.models.society.societyReportModel import SocietyReport
from studyFlax.tests.helpers.factories import make_user, make_superuser, authed_client

User = get_user_model()


class AdminUserListTest(TestCase):
    def setUp(self):
        self.admin = make_superuser()
        self.url = '/api/admin/users/'

    def test_admin_can_list_users(self):
        response = authed_client(self.admin).get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_response_includes_user_fields(self):
        make_user('alice')
        data = authed_client(self.admin).get(self.url).data
        usernames = [u['username'] for u in data]
        self.assertIn('alice', usernames)

    def test_non_admin_is_forbidden(self):
        regular = make_user('reg')
        response = authed_client(regular).get(self.url)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_unauthenticated_is_forbidden(self):
        response = APIClient().get(self.url)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_response_includes_is_active_and_ban_reason(self):
        make_user('bob')
        data = authed_client(self.admin).get(self.url).data
        bob = next(u for u in data if u['username'] == 'bob')
        self.assertIn('is_active', bob)
        self.assertIn('ban_reason', bob)


class AdminBanUserTest(TestCase):
    def setUp(self):
        self.admin = make_superuser()
        self.target = make_user('target')
        self.url = f'/api/admin/users/{self.target.id}/ban/'

    def test_ban_sets_user_inactive(self):
        authed_client(self.admin).post(self.url, {'action': 'ban', 'reason': 'Spam'}, format='json')
        self.target.refresh_from_db()
        self.assertFalse(self.target.is_active)

    def test_ban_stores_reason(self):
        authed_client(self.admin).post(self.url, {'action': 'ban', 'reason': 'Spam'}, format='json')
        self.target.refresh_from_db()
        self.assertEqual(self.target.ban_reason, 'Spam')

    def test_ban_returns_200(self):
        response = authed_client(self.admin).post(self.url, {'action': 'ban', 'reason': ''}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unban_restores_active(self):
        self.target.is_active = False
        self.target.ban_reason = 'Old reason'
        self.target.save()
        authed_client(self.admin).post(self.url, {'action': 'unban'}, format='json')
        self.target.refresh_from_db()
        self.assertTrue(self.target.is_active)

    def test_unban_clears_reason(self):
        self.target.is_active = False
        self.target.ban_reason = 'Old reason'
        self.target.save()
        authed_client(self.admin).post(self.url, {'action': 'unban'}, format='json')
        self.target.refresh_from_db()
        self.assertEqual(self.target.ban_reason, '')

    def test_cannot_ban_staff_user(self):
        staff = User.objects.create_user(
            username='staff2', email='staff2@example.com', password='pass', is_staff=True,
        )
        url = f'/api/admin/users/{staff.id}/ban/'
        response = authed_client(self.admin).post(url, {'action': 'ban', 'reason': ''}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ban_nonexistent_user_returns_404(self):
        url = '/api/admin/users/999999/ban/'
        response = authed_client(self.admin).post(url, {'action': 'ban'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_action_returns_400(self):
        response = authed_client(self.admin).post(self.url, {'action': 'delete'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_cannot_ban(self):
        regular = make_user('reg2')
        response = authed_client(regular).post(self.url, {'action': 'ban', 'reason': ''}, format='json')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])


class AdminTeacherRequestsTest(TestCase):
    def setUp(self):
        self.admin = make_superuser()
        self.list_url = '/api/admin/teacher-requests/'

    def _make_pending(self, username):
        u = make_user(username)
        u.role = 'pending_teacher'
        u.save()
        return u

    def test_list_returns_only_pending_teacher_users(self):
        self._make_pending('pending1')
        make_user('student1')
        data = authed_client(self.admin).get(self.list_url).data
        roles = [u['role'] for u in data]
        self.assertTrue(all(r == 'pending_teacher' for r in roles))
        self.assertEqual(len(roles), 1)

    def test_approve_grants_teacher_role(self):
        pending = self._make_pending('pending2')
        url = f'/api/admin/teacher-requests/{pending.id}/resolve/'
        authed_client(self.admin).post(url, {'decision': 'approve'}, format='json')
        pending.refresh_from_db()
        self.assertEqual(pending.role, 'teacher')

    def test_reject_sets_student_role(self):
        pending = self._make_pending('pending3')
        url = f'/api/admin/teacher-requests/{pending.id}/resolve/'
        authed_client(self.admin).post(url, {'decision': 'reject'}, format='json')
        pending.refresh_from_db()
        self.assertEqual(pending.role, 'student')

    def test_resolve_invalid_decision_returns_400(self):
        pending = self._make_pending('pending4')
        url = f'/api/admin/teacher-requests/{pending.id}/resolve/'
        response = authed_client(self.admin).post(url, {'decision': 'maybe'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resolve_non_pending_user_returns_404(self):
        regular = make_user('regular_user')
        url = f'/api/admin/teacher-requests/{regular.id}/resolve/'
        response = authed_client(self.admin).post(url, {'decision': 'approve'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_admin_cannot_list(self):
        regular = make_user('norole')
        response = authed_client(regular).get(self.list_url)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])


class RequestTeacherRoleTest(TestCase):
    def setUp(self):
        self.url = '/api/request-teacher-role/'

    def test_student_can_request_teacher_role(self):
        user = make_user('requester')
        user.role = 'student'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.role, 'pending_teacher')

    def test_teacher_cannot_request_again(self):
        user = make_user('teacher_user')
        user.role = 'teacher'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pending_teacher_cannot_request_again(self):
        user = make_user('pending_user')
        user.role = 'pending_teacher'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_request_returns_401(self):
        response = APIClient().post(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class AdminReportedSocietiesTest(TestCase):
    def setUp(self):
        self.admin = make_superuser()
        self.list_url = '/api/admin/reported-societies/'
        self.reporter = make_user('reporter')
        self.society = Society.objects.create(name='Test Society', ratification_status='none')

    def test_admin_can_list_reports(self):
        SocietyReport.objects.create(society=self.society, reporter=self.reporter, reason='Spam')
        response = authed_client(self.admin).get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_report_data_includes_expected_fields(self):
        SocietyReport.objects.create(society=self.society, reporter=self.reporter, reason='Spam')
        data = authed_client(self.admin).get(self.list_url).data[0]
        for field in ('id', 'society_id', 'society_name', 'reporter_id', 'reporter_username', 'reason'):
            self.assertIn(field, data)

    def test_non_admin_cannot_list_reports(self):
        response = authed_client(self.reporter).get(self.list_url)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_dismiss_report_deletes_it(self):
        report = SocietyReport.objects.create(society=self.society, reporter=self.reporter, reason='Spam')
        url = f'/api/admin/reports/{report.id}/dismiss/'
        response = authed_client(self.admin).delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SocietyReport.objects.filter(id=report.id).exists())

    def test_dismiss_nonexistent_report_returns_404(self):
        url = '/api/admin/reports/999999/dismiss/'
        response = authed_client(self.admin).delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class LoginBannedUserTest(TestCase):
    def setUp(self):
        self.url = '/api/auth/login/'
        self.user = make_user('banneduser', password='pass', is_active=False)
        self.user.set_password('pass')
        self.user.ban_reason = 'Violated community guidelines'
        self.user.save()

    def test_banned_user_gets_403(self):
        response = APIClient().post(self.url, {'username': 'banneduser', 'password': 'pass'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_banned_response_contains_is_banned_true(self):
        response = APIClient().post(self.url, {'username': 'banneduser', 'password': 'pass'})
        self.assertTrue(response.data.get('is_banned'))

    def test_banned_response_contains_correct_ban_reason(self):
        response = APIClient().post(self.url, {'username': 'banneduser', 'password': 'pass'})
        self.assertEqual(response.data.get('ban_reason'), 'Violated community guidelines')


class BanReportedSocietyTest(TestCase):
    def setUp(self):
        self.admin = make_superuser()
        self.reporter = make_user('reporter_ban')
        self.creator = make_user('creator_ban')
        self.society = Society.objects.create(name='BanSoc', bio='bio', admin_emails='a@b.com')
        SocietyMembership.objects.create(user=self.creator, society=self.society, role='admin')
        self.report = SocietyReport.objects.create(society=self.society, reporter=self.reporter, reason='Spam')

    def test_ban_society_deletes_it(self):
        url = f'/api/admin/reports/{self.report.id}/ban/'
        response = authed_client(self.admin).post(url, {'reason': 'Violated rules'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Society.objects.filter(id=self.society.id).exists())

    def test_ban_society_notifies_creator(self):
        url = f'/api/admin/reports/{self.report.id}/ban/'
        authed_client(self.admin).post(url, {'reason': 'Bad content'}, format='json')
        self.assertTrue(Notification.objects.filter(user=self.creator).exists())

    def test_ban_society_without_reason(self):
        url = f'/api/admin/reports/{self.report.id}/ban/'
        response = authed_client(self.admin).post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ban_society_nonexistent_report_returns_404(self):
        url = '/api/admin/reports/999999/ban/'
        response = authed_client(self.admin).post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_ban_society_no_admin_membership(self):
        society2 = Society.objects.create(name='NoAdmin', bio='bio', admin_emails='a@b.com')
        report2 = SocietyReport.objects.create(society=society2, reporter=self.reporter, reason='Spam')
        url = f'/api/admin/reports/{report2.id}/ban/'
        response = authed_client(self.admin).post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Society.objects.filter(id=society2.id).exists())

    def test_non_admin_cannot_ban_society(self):
        url = f'/api/admin/reports/{self.report.id}/ban/'
        response = authed_client(self.reporter).post(url, {}, format='json')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])


class CancelTeacherRoleRequestTest(TestCase):
    def setUp(self):
        self.url = '/api/cancel-teacher-role/'

    def test_pending_teacher_can_cancel(self):
        user = make_user('cancel_pending')
        user.role = 'pending_teacher'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.role, 'student')

    def test_student_cannot_cancel(self):
        user = make_user('cancel_student')
        user.role = 'student'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_teacher_cannot_cancel(self):
        user = make_user('cancel_teacher')
        user.role = 'teacher'
        user.save()
        response = authed_client(user).post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_cannot_cancel(self):
        response = APIClient().post(self.url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
