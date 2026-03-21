"""
Backend tests for signals society.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from studyFlax.models.society.society_model import Society
from studyFlax.models.society.society_calendar_sync_model import SocietyCalendarSync
from studyFlax.models.society.society_event_model import SocietyEvent
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.models.society.society_announcement_model import SocietyAnnouncement
from studyFlax.models.notifications.notification_model import Notification
<<<<<<< HEAD
from studyFlax.tests.helpers.test_model_builders import make_user, make_society, make_society_event

=======
from studyFlax.tests.helpers.factories import make_user, make_society, make_society_event
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

User = get_user_model()

def make_member(user, society, role='member'):
    return SocietyMembership.objects.create(user=user, society=society, role=role, is_subscribed=True)

class NotifyMembersOnEventTest(TestCase):
    """Tests for notify_members_on_event signal."""

    def setUp(self):
        self.admin = make_user('sig_admin', email='sig_admin@e.com')
        self.member1 = make_user('sig_m1', email='sig_m1@e.com')
        self.member2 = make_user('sig_m2', email='sig_m2@e.com')
        self.society = make_society('Signal Society')
        make_member(self.admin, self.society, role='admin')
        make_member(self.member1, self.society)
        make_member(self.member2, self.society)

    def test_new_event_notifies_members(self):
        Notification.objects.all().delete()
        make_society_event(self.society, 'New Event')
        notifications = Notification.objects.filter(
            notification_type='society_event'
        )
        self.assertGreaterEqual(notifications.count(), 2)
        titles = list(notifications.values_list('title', flat=True))
        self.assertTrue(any('New event' in t for t in titles))

    def test_new_event_skipped_when_silent(self):
        Notification.objects.all().delete()
        event = SocietyEvent(
            society=self.society, title='Silent Event',
            start_time=timezone.now() + timezone.timedelta(days=1),
            end_time=timezone.now() + timezone.timedelta(days=1, hours=2),
            recurrence='none',
        )
        event._skip_notification = True
        event.save()
        notifications = Notification.objects.filter(notification_type='society_event')
        self.assertEqual(notifications.count(), 0)

    def test_update_event_notifies_members(self):
        event = make_society_event(self.society, 'Original')
        Notification.objects.all().delete()
        event.title = 'Updated Event'
        event.save()
        notifications = Notification.objects.filter(notification_type='society_event')
        self.assertGreaterEqual(notifications.count(), 2)
        titles = list(notifications.values_list('title', flat=True))
        self.assertTrue(any('Event updated' in t for t in titles))

    def test_delete_event_notifies_members(self):
        event = make_society_event(self.society, 'Deleted Event')
        Notification.objects.all().delete()
        event.delete()
        notifications = Notification.objects.filter(notification_type='society_event')
        self.assertGreaterEqual(notifications.count(), 2)

    def test_delete_event_with_announcement_does_not_notify(self):
        ann = SocietyAnnouncement.objects.create(
            society=self.society, title='Ann', content='C'
        )
        event = SocietyEvent.objects.create(
            society=self.society, title='Ann Event',
            start_time=timezone.now() + timezone.timedelta(days=1),
            end_time=timezone.now() + timezone.timedelta(days=1, hours=2),
            recurrence='none', announcement=ann
        )
        Notification.objects.all().delete()
        event.delete()
        event_cancel_notifications = Notification.objects.filter(
            notification_type='society_event',
            title__icontains='cancelled'
        )
        self.assertEqual(event_cancel_notifications.count(), 0)

    def test_delete_event_silent(self):
        event = make_society_event(self.society, 'Quiet Delete')
        Notification.objects.all().delete()
        event._skip_notification = True
        event.delete()
        notifications = Notification.objects.filter(notification_type='society_event')
        self.assertEqual(notifications.count(), 0)

class NotifyMembersOnAnnouncementTest(TestCase):
    """Tests for notify_members_on_announcement signal."""

    def setUp(self):
        self.admin = make_user('ann_sig_admin', email='ann_sig_admin@e.com')
        self.member = make_user('ann_sig_member', email='ann_sig_member@e.com')
        self.society = make_society('Ann Signal Society')
        make_member(self.admin, self.society, role='admin')
        make_member(self.member, self.society)

    def test_new_announcement_notifies_members(self):
        Notification.objects.all().delete()
        SocietyAnnouncement.objects.create(
            society=self.society, title='Big News', content='Details here'
        )
        notifications = Notification.objects.filter(notification_type='society_announcement')
        self.assertGreaterEqual(notifications.count(), 2)
        titles = list(notifications.values_list('title', flat=True))
        self.assertTrue(any('announcement' in t.lower() for t in titles))

    def test_announcement_skip_notification(self):
        Notification.objects.all().delete()
        ann = SocietyAnnouncement(
            society=self.society, title='Silent', content='Quiet'
        )
        ann._skip_notification = True
        ann.save()
        notifications = Notification.objects.filter(notification_type='society_announcement')
        self.assertEqual(notifications.count(), 0)

    def test_delete_announcement_notifies_members(self):
        ann = SocietyAnnouncement.objects.create(
            society=self.society, title='Deleted Ann', content='Gone'
        )
        Notification.objects.all().delete()
        ann.delete()
        notifications = Notification.objects.filter(notification_type='society_announcement')
        self.assertGreaterEqual(notifications.count(), 2)

    def test_delete_announcement_with_event_message(self):
        ann = SocietyAnnouncement.objects.create(
            society=self.society, title='Ann With Event', content='C'
        )
        SocietyEvent.objects.create(
            society=self.society, title='Ann Event',
            start_time=timezone.now() + timezone.timedelta(days=1),
            end_time=timezone.now() + timezone.timedelta(days=1, hours=2),
            recurrence='none', announcement=ann
        )
        Notification.objects.all().delete()
        ann.delete()
        notifications = Notification.objects.filter(notification_type='society_announcement')
        self.assertGreaterEqual(notifications.count(), 2)
        messages = list(notifications.values_list('message', flat=True))
        self.assertTrue(any('event' in m.lower() for m in messages))

    def test_delete_announcement_silent(self):
        ann = SocietyAnnouncement.objects.create(
            society=self.society, title='Quiet Delete', content='C'
        )
        Notification.objects.all().delete()
        ann._skip_notification = True
        ann.delete()
        notifications = Notification.objects.filter(notification_type='society_announcement')
        self.assertEqual(notifications.count(), 0)

class HandleSocietyDeleteTest(TestCase):
    """Tests for handle_society_delete signal (admin deletion path)."""

    def setUp(self):
        self.member1 = make_user('del_m1', email='del_m1@e.com')
        self.member2 = make_user('del_m2', email='del_m2@e.com')
        self.society = make_society('Deleted Society')
        make_member(self.member1, self.society)
        make_member(self.member2, self.society)
        self.event = make_society_event(self.society, 'Society Event')
        self.ann = SocietyAnnouncement.objects.create(
            society=self.society, title='Ann', content='C'
        )

    def test_society_delete_notifies_members(self):
        Notification.objects.all().delete()
        self.society.delete()
        notifications = Notification.objects.filter(notification_type='society_deleted')
        self.assertGreaterEqual(notifications.count(), 2)
        titles = list(notifications.values_list('title', flat=True))
        self.assertTrue(any('deleted' in t.lower() for t in titles))

    def test_society_delete_silent(self):
        Notification.objects.all().delete()
        self.society._skip_notification = True
        self.society.delete()
        notifications = Notification.objects.filter(notification_type='society_deleted')
        self.assertEqual(notifications.count(), 0)

class SignalHelperFunctionsTest(TestCase):
    """Unit tests for individual helper functions in society_notifications.py."""

    def test_build_event_notification_new(self):
        from studyFlax.signals.society_notifications import build_event_notification
        society = make_society('Helper Society')
        event = make_society_event(society, 'Test Event')
        data = build_event_notification(event, 'new')
        self.assertIn('New event', data['title'])
        self.assertEqual(data['notification_type'], 'society_event')

    def test_build_event_notification_updated(self):
        from studyFlax.signals.society_notifications import build_event_notification
        society = make_society('Helper Society 2')
        event = make_society_event(society, 'Updated Event')
        data = build_event_notification(event, 'updated')
        self.assertIn('Event updated', data['title'])

    def test_build_announcement_notification(self):
        from studyFlax.signals.society_notifications import build_announcement_notification
        society = make_society('Ann Helper Society')
        ann = SocietyAnnouncement.objects.create(
            society=society, title='Test Ann', content='C'
        )
        data = build_announcement_notification(ann)
        self.assertEqual(data['notification_type'], 'society_announcement')
        self.assertIn('announcement', data['title'].lower())

    def test_build_delete_message_with_event(self):
        from studyFlax.signals.society_notifications import build_delete_message
        msg = build_delete_message('My Announcement', has_event=True)
        self.assertIn('event', msg.lower())

    def test_build_delete_message_without_event(self):
        from studyFlax.signals.society_notifications import build_delete_message
        msg = build_delete_message('My Announcement', has_event=False)
        self.assertNotIn('event', msg.lower())
        self.assertIn('My Announcement', msg)

    def test_build_society_calendar_url(self):
        from studyFlax.signals.society_notifications import build_society_calendar_url
        url = build_society_calendar_url(42)
        self.assertEqual(url, 'societies_42_calendar')

    def test_build_society_announcements_url(self):
        from studyFlax.signals.society_notifications import build_society_announcements_url
        url = build_society_announcements_url(42)
        self.assertEqual(url, 'societies_42_announcements')

    def test_format_event_time(self):
        from studyFlax.signals.society_notifications import format_event_time
        society = make_society('Format Society')
        event = make_society_event(society)
        result = format_event_time(event)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 5)

    def test_notify_society_members(self):
        from studyFlax.signals.society_notifications import notify_society_members
        m1 = make_user('notif_m1', email='notif_m1@e.com')
        m2 = make_user('notif_m2', email='notif_m2@e.com')
        society = make_society('Notify Society')
        make_member(m1, society)
        make_member(m2, society)
        Notification.objects.all().delete()
        notify_society_members(society, {
            'title': 'Test',
            'message': 'Hello',
            'notification_type': 'general',
        })
        self.assertEqual(Notification.objects.filter(title='Test').count(), 2)

    def test_delete_children_silently(self):
        from studyFlax.signals.society_notifications import delete_children_silently
        society = make_society('Child Society')
        event = make_society_event(society)
        ann = SocietyAnnouncement.objects.create(
            society=society, title='A', content='C'
        )
        Notification.objects.all().delete()
        delete_children_silently(society)
        self.assertFalse(SocietyEvent.objects.filter(id=event.id).exists())
        self.assertFalse(SocietyAnnouncement.objects.filter(id=ann.id).exists())
        self.assertEqual(Notification.objects.count(), 0)

class MembershipAndSyncHelperCoverageTest(TestCase):
    """Tests for membership and calendar-sync helper function branches."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.admin = User.objects.create_user(username='admin_cov', email='admin_cov@example.com', password='pass')
        self.other = User.objects.create_user(username='other_cov', email='other_cov@example.com', password='pass')
        self.society = Society.objects.create(name='Coverage Society', bio='bio', admin_emails='admin@example.com')
        self.admin_membership = SocietyMembership.objects.create(user=self.admin, society=self.society, role='admin')

    def test_find_user_by_identifier_email_and_none(self):
        from studyFlax.views.society.membership_view import find_user_by_identifier
        self.assertEqual(find_user_by_identifier({'email': 'other_cov@example.com'}), self.other)
        self.assertIsNone(find_user_by_identifier({}))

    def test_get_membership_by_user_id_none(self):
        from studyFlax.views.society.membership_view import get_membership_by_user_id
        self.assertIsNone(get_membership_by_user_id(self.society, 99999))

    def test_leave_or_remove_sets_skip_notification_for_self(self):
        from studyFlax.views.society.membership_view import leave_or_remove
        SocietyMembership.objects.create(user=self.other, society=self.society, role='member')
        SocietyCalendarSync.objects.create(user=self.other, society=self.society)
        request = self.factory.delete('/')
        request.user = self.other
        response = leave_or_remove(request, self.society, self.other.id)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(SocietyCalendarSync.objects.filter(user=self.other, society=self.society).exists())

    def test_sync_status_true_and_unsync_deleted_true(self):
        from studyFlax.views.society.calendar_sync_view import sync_status, unsync_calendar
        SocietyMembership.objects.create(user=self.other, society=self.society, role='member')
        SocietyCalendarSync.objects.create(user=self.other, society=self.society)
        request = self.factory.get('/')
        force_authenticate(request, user=self.other)
        status_response = sync_status(request, self.society.id)
        self.assertTrue(status_response.data['is_synced'])
        delete_request = self.factory.delete('/')
        force_authenticate(delete_request, user=self.other)
        delete_response = unsync_calendar(delete_request, self.society.id)
        self.assertTrue(delete_response.data['deleted'])

class RatificationSignalCoverageTest(TestCase):
    """Tests for ratification signal skip_notification."""

    def test_skip_notification_suppresses_signal(self):
        society = Society.objects.create(
            name='SigSociety', bio='bio', admin_emails='admin@test.com',
            ratification_status='none',
        )
        initial_count = Notification.objects.count()
        society._skip_notification = True
        society.ratification_status = 'pending'
        society.save()
        self.assertEqual(Notification.objects.count(), initial_count)

    def test_rejected_status_notifies_editors(self):
        from studyFlax.signals.ratification_notifications import get_status_message
        msg = get_status_message('TestSociety', 'rejected')
        self.assertIn('rejected', msg)
        self.assertIn('TestSociety', msg)

    def test_approved_status_message(self):
        from studyFlax.signals.ratification_notifications import get_status_message
        msg = get_status_message('TestSociety', 'approved')
        self.assertIn('approved', msg)

    def test_fetch_old_status_returns_none_for_missing_pk(self):
        from studyFlax.signals.ratification_notifications import _fetch_old_status
        self.assertIsNone(_fetch_old_status(999999))

    def test_resolve_event_action_returns_none_when_not_created_and_no_update(self):
        from studyFlax.signals.society_notifications import _resolve_event_action
        from unittest.mock import MagicMock
        instance = MagicMock()
        instance._is_update = False
        self.assertIsNone(_resolve_event_action(instance, created=False))
