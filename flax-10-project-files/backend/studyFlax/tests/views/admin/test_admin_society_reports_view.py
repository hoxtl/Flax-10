"""
Tests for admin society report workflows.
"""

from django.test import TestCase
from rest_framework import status

from studyFlax.models.notifications.notification_model import Notification
from studyFlax.models.society.society_model import Society
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.models.society.society_report_model import SocietyReport
from studyFlax.tests.helpers.factories import make_user, make_superuser, authed_client


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
