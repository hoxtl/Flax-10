"""
Backend tests for models.
"""

from django.test import TestCase, RequestFactory
from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from studyFlax.models import Tag, Category, RecurrenceRule
from studyFlax.models.authentication.course_change_request_model import CourseChangeRequest
from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.models.calendar.event_attendance_model import EventAttendance
from studyFlax.models.society.society_model import Society
from studyFlax.models.society.society_report_model import SocietyReport
from studyFlax.models.society.society_announcement_model import SocietyAnnouncement, SocietyAnnouncementImage
from studyFlax.models.society.society_calendar_sync_model import SocietyCalendarSync
from studyFlax.models.society.society_event_model import SocietyEvent
from studyFlax.models.society.society_image_model import SocietyImage
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.models.society.society_tag_model import SocietyTag
from studyFlax.models.tasks.task_model import Task, TaskList
from studyFlax.models.timer.theme_session_model import ThemeSession
from studyFlax.admin import ReportedSociety, ReportedSocietyAdmin

User = get_user_model()

class ModelStringTests(TestCase):
    """Tests for model string representations."""
    
    def test_tag_str(self):
        tag = Tag(name="Study")
        self.assertEqual(str(tag), "Study")
        
    def test_category_str(self):
        category = Category(name="Work")
        self.assertEqual(str(category), "Work")
        
    def test_recurrence_rule_str(self):
        rule = RecurrenceRule(frequency="daily", interval=2)
        self.assertEqual(str(rule), "daily every 2")

    def test_society_report_str(self):
        user = User.objects.create_user(username='rep', email='rep@test.com', password='pass')
        society = Society.objects.create(name='MySociety', bio='bio', admin_emails='a@b.com')
        report = SocietyReport.objects.create(society=society, reporter=user, reason='spam')
        self.assertEqual(str(report), "Report for MySociety by rep")

    def test_user_is_student(self):
        user = User.objects.create_user(username='stud', email='stud@test.com', password='pass')
        self.assertTrue(user.is_student())

    def test_user_is_teacher(self):
        user = User.objects.create_user(username='tchr', email='tchr@test.com', password='pass', role='teacher')
        self.assertTrue(user.is_teacher())

    def test_user_is_pending_teacher(self):
        user = User.objects.create_user(username='pend', email='pend@test.com', password='pass', role='pending_teacher')
        self.assertTrue(user.is_pending_teacher())

    def test_event_attendance_str_attended(self):
        user = User.objects.create_user(username='att_user', email='att@test.com', password='pass')
        event = CalendarEvent.objects.create(
            user=user, title='Lecture',
            start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1),
        )
        att = EventAttendance.objects.create(user=user, event=event, attended=True)
        self.assertIn('attended', str(att))

    def test_event_attendance_str_missed(self):
        user = User.objects.create_user(username='miss_user', email='miss@test.com', password='pass')
        event = CalendarEvent.objects.create(
            user=user, title='Lab',
            start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1),
        )
        att = EventAttendance.objects.create(user=user, event=event, attended=False)
        self.assertIn('missed', str(att))

    def test_course_change_request_str(self):
        user = User.objects.create_user(username='cc_str', email='cc_str@test.com', password='pass')
        req = CourseChangeRequest.objects.create(
            user=user, requested_course='Math', current_course='Physics',
        )
        self.assertIn('cc_str', str(req))
        self.assertIn('Physics', str(req))
        self.assertIn('Math', str(req))

    def test_society_str(self):
        society = Society.objects.create(name='TestSoc', bio='bio', admin_emails='a@b.com')
        self.assertEqual(str(society), 'TestSoc')

    def test_society_announcement_str(self):
        society = Society.objects.create(name='AnnSoc', bio='bio', admin_emails='a@b.com')
        ann = SocietyAnnouncement.objects.create(society=society, title='Hello', content='World')
        self.assertIn('Hello', str(ann))

    def test_society_announcement_image_str(self):
        society = Society.objects.create(name='ImgSoc', bio='bio', admin_emails='a@b.com')
        ann = SocietyAnnouncement.objects.create(society=society, title='AnnImg', content='')
        img = SocietyAnnouncementImage.objects.create(announcement=ann, url='http://example.com/img.jpg')
        self.assertIn('AnnImg', str(img))

    def test_society_calendar_sync_str(self):
        user = User.objects.create_user(username='syncuser', email='syncuser@test.com', password='pass')
        society = Society.objects.create(name='SyncSoc', bio='bio', admin_emails='a@b.com')
        sync = SocietyCalendarSync.objects.create(user=user, society=society)
        self.assertIn('syncuser', str(sync))

    def test_society_event_str(self):
        society = Society.objects.create(name='EvtSoc', bio='bio', admin_emails='a@b.com')
        event = SocietyEvent.objects.create(
            society=society, title='MyEvent',
            start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1),
        )
        self.assertIn('MyEvent', str(event))

    def test_society_image_str(self):
        society = Society.objects.create(name='SocImg', bio='bio', admin_emails='a@b.com')
        img = SocietyImage.objects.create(society=society, url='http://example.com/pic.jpg')
        self.assertIn('SocImg', str(img))

    def test_society_membership_str(self):
        user = User.objects.create_user(username='memuser', email='memuser@test.com', password='pass')
        society = Society.objects.create(name='MemSoc', bio='bio', admin_emails='a@b.com')
        membership = SocietyMembership.objects.create(user=user, society=society, role='member')
        self.assertIn('memuser', str(membership))

    def test_society_tag_str(self):
        society = Society.objects.create(name='TagSoc', bio='bio', admin_emails='a@b.com')
        tag = SocietyTag.objects.create(society=society, label='Events', color='#ff0000')
        self.assertIn('Events', str(tag))

    def test_task_list_str(self):
        user = User.objects.create_user(username='taskuser', email='taskuser@test.com', password='pass')
        task_list = TaskList.objects.create(user=user, name='My Tasks', category='personal')
        self.assertIn('taskuser', str(task_list))

    def test_task_str(self):
        user = User.objects.create_user(username='taskuser2', email='taskuser2@test.com', password='pass')
        task = Task.objects.create(user=user, title='Buy milk')
        self.assertEqual(str(task), 'Buy milk')

    def test_theme_session_str(self):
        user = User.objects.create_user(username='themeuser', email='themeuser@test.com', password='pass')
        session = ThemeSession.objects.create(
            user=user, theme='dark',
            started_at=timezone.now(), ended_at=timezone.now() + timedelta(hours=1),
            duration_minutes=60,
        )
        self.assertIn('dark', str(session))

class ReportedSocietyAdminTest(TestCase):
    """Tests for reported society admin."""

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


class ScheduleModelStringTests(TestCase):

    def setUp(self):
        from studyFlax.models.calendar.schedule_model import Schedule, ScheduleEventAllocation
        from studyFlax.models.calendar.calendar_event_model import CalendarEvent
        self.user = User.objects.create_user(
            username='sched_str', email='sched_str@test.com', password='pass'
        )
        self.schedule = Schedule.objects.create(
            title='My Plan', user=self.user,
        )
        self.event = CalendarEvent.objects.create(
            user=self.user, title='Study block',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )
        self.allocation = ScheduleEventAllocation.objects.create(
            schedule=self.schedule, event=self.event,
        )

    def test_schedule_str(self):
        self.assertIn('My Plan', str(self.schedule))
        self.assertIn(self.user.email, str(self.schedule))

    def test_schedule_event_allocation_str(self):
        result = str(self.allocation)
        self.assertIn(str(self.schedule.id), result)
        self.assertIn(str(self.event.id), result)
