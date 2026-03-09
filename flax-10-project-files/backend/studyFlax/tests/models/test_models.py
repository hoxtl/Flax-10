from django.test import TestCase, RequestFactory
from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from studyFlax.models import Tag, Category, RecurrenceRule
from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyReportModel import SocietyReport
from studyFlax.admin import ReportedSociety, ReportedSocietyAdmin

User = get_user_model()

class ModelStringTests(TestCase):
    """Tests for model string representations."""
    
    def test_tag_str(self):
        """Test tag string representation."""
        tag = Tag(name="Study")
        self.assertEqual(str(tag), "Study")
        
    def test_category_str(self):
        """Test category string representation."""
        category = Category(name="Work")
        self.assertEqual(str(category), "Work")
        
    def test_recurrence_rule_str(self):
        """Test recurrence rule string representation."""
        rule = RecurrenceRule(frequency="daily", interval=2)
        self.assertEqual(str(rule), "daily every 2")

    def test_society_report_str(self):
        user = User.objects.create_user(username='rep', email='rep@test.com', password='pass')
        society = Society.objects.create(name='MySociety', bio='bio', admin_emails='a@b.com')
        report = SocietyReport.objects.create(society=society, reporter=user, reason='spam')
        self.assertEqual(str(report), "Report for MySociety by rep")


class ReportedSocietyAdminTest(TestCase):
    def setUp(self):
        self.site = AdminSite()
        self.admin_obj = ReportedSocietyAdmin(ReportedSociety, self.site)
        self.superuser = User.objects.create_superuser(
            username='siteadmin', email='siteadmin@test.com', password='pass'
        )
        self.factory = RequestFactory()

    def test_get_queryset_only_includes_reported_societies(self):
        reporter = User.objects.create_user(username='r', email='r@test.com', password='pass')
        society_with = Society.objects.create(name='Reported', bio='b', admin_emails='a@b.com')
        Society.objects.create(name='Clean', bio='b', admin_emails='a@b.com')
        SocietyReport.objects.create(society=society_with, reporter=reporter, reason='bad')

        request = self.factory.get('/')
        request.user = self.superuser
        qs = self.admin_obj.get_queryset(request)
        self.assertIn(society_with.id, list(qs.values_list('id', flat=True)))

    def test_report_count(self):
        society = Society.objects.create(name='Counted', bio='b', admin_emails='a@b.com')
        r1 = User.objects.create_user(username='c1', email='c1@test.com', password='pass')
        r2 = User.objects.create_user(username='c2', email='c2@test.com', password='pass')
        SocietyReport.objects.create(society=society, reporter=r1, reason='a')
        SocietyReport.objects.create(society=society, reporter=r2, reason='b')
        self.assertEqual(self.admin_obj.report_count(society), 2)
