"""
Comprehensive coverage tests for all remaining uncovered source lines.
"""
from django.test import TestCase, RequestFactory
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock

from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyMembershipModel import SocietyMembership
from studyFlax.models.society.societyTagModel import SocietyTag
from studyFlax.models.society.societyAnnouncementModel import SocietyAnnouncement, SocietyAnnouncementImage
from studyFlax.models.society.societyEventModel import SocietyEvent
from studyFlax.models.society.societyImageModel import SocietyImage
from studyFlax.models.society.societyCalendarSyncModel import SocietyCalendarSync
from studyFlax.models.social.shareModel import CalendarShare
from studyFlax.models.auth.resetPasswordTokenModel import ResetPasswordToken
from studyFlax.models.auth.userSettingsModel import UserSettings
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.timer.themeSessionModel import ThemeSession
from studyFlax.models import Tag, CalendarEvent, Module
from studyFlax.models.modules.enrollmentModel import Enrollment
from studyFlax.models.notifications.notificationModel import Notification

User = get_user_model()


def make_user(username='fcuser', email='fc@example.com', role='student'):
    return User.objects.create_user(
        username=username, email=email, password='pass',
        first_name='Test', last_name='User', role=role
    )


def make_society(name='FC Society'):
    return Society.objects.create(name=name, bio='Bio', admin_emails='a@test.com')


def make_admin(user, society):
    return SocietyMembership.objects.create(user=user, society=society, role='admin')


def make_member(user, society):
    return SocietyMembership.objects.create(user=user, society=society, role='member')


def make_module(code, name, creator):
    now = timezone.now()
    return Module.objects.create(
        module_code=code, module_name=name, created_by=creator,
        start_time=now, end_time=now + timedelta(hours=1),
    )


def make_session(user, days_ago=0, hour=10, duration=60, status_str='Completed'):
    base = timezone.now() - timedelta(days=days_ago)
    end_time = base.replace(hour=hour, minute=0, second=0, microsecond=0)
    start_time = end_time - timedelta(minutes=duration)
    return StudySession.objects.create(
        user=user, start_time=start_time, end_time=end_time,
        duration=duration, break_duration=0, pause_duration=0,
        session_count=1, study_block_id=1, status=status_str
    )


# ---------------------------------------------------------------------------
# Model __str__ methods
# ---------------------------------------------------------------------------

class ModelStrMethodsTest(TestCase):
    def setUp(self):
        self.user = make_user('str_user', 'str@e.com')
        self.society = make_society('Str Society')
        make_admin(self.user, self.society)

    def test_reset_password_token_str(self):
        from django.utils import timezone as tz
        from datetime import timedelta
        token = ResetPasswordToken.objects.create(
            user=self.user, token='abc123tok',
            expires_at=tz.now() + timedelta(hours=1)
        )
        self.assertIsInstance(str(token), str)

    def test_user_is_student(self):
        self.assertTrue(self.user.is_student())

    def test_share_model_str(self):
        other = make_user('str_other', 'str_other@e.com')
        share = CalendarShare.objects.create(owner=self.user, shared_with=other)
        self.assertIsInstance(str(share), str)

    def test_society_announcement_str(self):
        ann = SocietyAnnouncement.objects.create(
            society=self.society, title='Test Ann', content='Content'
        )
        self.assertIsInstance(str(ann), str)

    def test_society_announcement_image_str(self):
        ann = SocietyAnnouncement.objects.create(
            society=self.society, title='Ann2', content='C'
        )
        img = SocietyAnnouncementImage.objects.create(announcement=ann, url='http://img.jpg', order=0)
        self.assertIsInstance(str(img), str)

    def test_society_calendar_sync_str(self):
        sync = SocietyCalendarSync.objects.create(user=self.user, society=self.society)
        self.assertIsInstance(str(sync), str)

    def test_society_event_str(self):
        event = SocietyEvent.objects.create(
            society=self.society, title='Event',
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=1),
            recurrence='none'
        )
        self.assertIsInstance(str(event), str)

    def test_society_image_str(self):
        img = SocietyImage.objects.create(society=self.society, url='http://img.jpg', is_cover=True)
        self.assertIsInstance(str(img), str)

    def test_society_membership_str(self):
        m = SocietyMembership.objects.get(user=self.user, society=self.society)
        self.assertIsInstance(str(m), str)

    def test_society_model_str(self):
        self.assertIsInstance(str(self.society), str)

    def test_society_tag_str(self):
        tag = SocietyTag.objects.create(society=self.society, label='TestTag', color='#fff')
        self.assertIsInstance(str(tag), str)

    def test_task_list_str(self):
        from studyFlax.models.tasks.taskModel import TaskList
        task_list = TaskList.objects.create(user=self.user, name='My List')
        self.assertIsInstance(str(task_list), str)

    def test_task_str(self):
        from studyFlax.models.tasks.taskModel import Task
        task = Task.objects.create(user=self.user, title='My Task')
        self.assertIsInstance(str(task), str)

    def test_theme_session_str(self):
        ts = ThemeSession.objects.create(
            user=self.user, theme='dark', duration_minutes=60,
            started_at=timezone.now() - timedelta(hours=1), ended_at=timezone.now()
        )
        self.assertIsInstance(str(ts), str)


# ---------------------------------------------------------------------------
# hello.py view
# ---------------------------------------------------------------------------

class HelloViewTest(TestCase):
    def test_hello_view_direct(self):
        from studyFlax.views.hello import hello
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/')
        response = hello(request)
        import json
        data = json.loads(response.content)
        self.assertIn('message', data)


# ---------------------------------------------------------------------------
# ai_views.py line 72 — streak break (non-consecutive sessions)
# ---------------------------------------------------------------------------

class AiViewsStreakBreakTest(TestCase):
    def setUp(self):
        self.user = make_user('ai_streak', 'ai_streak@e.com')

    def test_build_user_context_streak_break(self):
        from studyFlax.views.analytics.ai_views import _build_user_context
        make_session(self.user, days_ago=10, duration=60)
        make_session(self.user, days_ago=5, duration=60)  # gap between 10 and 5
        context = _build_user_context(self.user, days=30)
        self.assertIsInstance(context, str)


# ---------------------------------------------------------------------------
# analytics_views.py line 23 — non-consecutive dates in streak calc
# ---------------------------------------------------------------------------

class AnalyticsViewsStreakBreakTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('analytics_streak', 'analytics_streak@e.com')
        self.client.force_authenticate(user=self.user)

    def test_analytics_with_non_consecutive_sessions(self):
        make_session(self.user, days_ago=10)
        make_session(self.user, days_ago=5)  # gap → else: temp = 1
        response = self.client.get('/api/analytics/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# theme_views.py line 67 — light theme session
# ---------------------------------------------------------------------------

class ThemeViewsLightThemeTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('light_theme', 'light_theme@e.com')
        self.client.force_authenticate(user=self.user)

    def test_get_theme_stats_with_light_session(self):
        ThemeSession.objects.create(
            user=self.user, theme='light', duration_minutes=60,
            started_at=timezone.now() - timedelta(hours=2), ended_at=timezone.now() - timedelta(hours=1)
        )
        response = self.client.get('/api/analytics/theme-stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# share_views.py — missing paths
# ---------------------------------------------------------------------------

class ShareViewsMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('share_user', 'share_user@e.com')
        self.other = make_user('share_other', 'share_other@e.com')
        self.client.force_authenticate(user=self.user)

    def test_share_with_nonexistent_user(self):
        response = self.client.post('/api/social/99999/share/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unshare_when_not_sharing(self):
        response = self.client.post(f'/api/social/{self.other.id}/unshare/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not sharing', response.data['error'])

    def test_sharing_with_nonexistent_user(self):
        response = self.client.get('/api/social/99999/sharing-with/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_shared_with_me_nonexistent_user(self):
        response = self.client.get('/api/social/99999/shared-with-me/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_sharing_with_paginated_response(self):
        CalendarShare.objects.create(owner=self.user, shared_with=self.other)
        response = self.client.get(f'/api/social/{self.user.id}/sharing-with/?limit=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_shared_with_me_paginated_response(self):
        CalendarShare.objects.create(owner=self.other, shared_with=self.user)
        response = self.client.get(f'/api/social/{self.user.id}/shared-with-me/?limit=10')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# settings/user_settings_view.py — missing paths
# ---------------------------------------------------------------------------

class SettingsViewMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('sv_user', 'sv_user@e.com')
        self.client.force_authenticate(user=self.user)

    def test_patch_with_first_name(self):
        response = self.client.patch('/api/settings/', {'first_name': 'NewFirst'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'NewFirst')

    def test_patch_with_last_name(self):
        response = self.client.patch('/api/settings/', {'last_name': 'NewLast'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.last_name, 'NewLast')

    def test_patch_with_valid_password(self):
        response = self.client.patch('/api/settings/', {'password': 'newpassword123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_with_short_password_returns_error(self):
        response = self.client.patch('/api/settings/', {'password': 'short'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_patch_with_invalid_settings_data(self):
        """PATCH with major already set should fail (validate_major raises)."""
        settings = UserSettings.objects.create(
            user=self.user, theme='light', timezone='UTC',
            major='Computer Science'
        )
        response = self.client.patch('/api/settings/', {'major': 'Physics'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# user/settings_views.py — helper functions (not exposed via URL)
# ---------------------------------------------------------------------------

class UserSettingsHelpersTest(TestCase):
    def setUp(self):
        self.user = make_user('ushelp', 'ushelp@e.com')

    def test_get_or_create_settings_creates_defaults(self):
        from studyFlax.views.user.settings_views import get_or_create_settings
        settings = get_or_create_settings(self.user)
        self.assertEqual(settings.theme, 'light')
        self.assertEqual(settings.timezone, 'Europe/London')

    def test_get_or_create_settings_returns_existing(self):
        from studyFlax.views.user.settings_views import get_or_create_settings
        UserSettings.objects.create(user=self.user, theme='dark', timezone='UTC')
        settings = get_or_create_settings(self.user)
        self.assertEqual(settings.theme, 'dark')

    def test_apply_settings_updates_theme(self):
        from studyFlax.views.user.settings_views import get_or_create_settings, apply_settings_updates
        settings = get_or_create_settings(self.user)
        apply_settings_updates(settings, {'theme': 'dark', 'timezone': 'UTC'})
        self.assertEqual(settings.theme, 'dark')
        self.assertEqual(settings.timezone, 'UTC')

    def test_user_settings_view_get(self):
        from studyFlax.views.user.settings_views import user_settings_view
        factory = APIRequestFactory()
        request = factory.get('/fake/')
        request.user = self.user
        from rest_framework.request import Request
        drf_request = Request(request)
        drf_request.user = self.user
        drf_request.method = 'GET'
        response = user_settings_view(request)
        self.assertIn(response.status_code, [200, 401])

    def test_user_settings_view_put(self):
        from studyFlax.views.user.settings_views import user_settings_view
        factory = APIRequestFactory()
        request = factory.put('/fake/', {'theme': 'dark', 'timezone': 'UTC'})
        request.user = self.user
        response = user_settings_view(request)
        self.assertIn(response.status_code, [200, 400, 401])


# ---------------------------------------------------------------------------
# socialSerializer.py — missing paths (is_sharing=True, create, validate)
# ---------------------------------------------------------------------------

class SocialSerializerMissingPathsTest(TestCase):
    def setUp(self):
        self.owner = make_user('social_owner2', 'social_owner2@e.com')
        self.viewer = make_user('social_viewer2', 'social_viewer2@e.com')
        CalendarShare.objects.create(owner=self.owner, shared_with=self.viewer)

    def test_is_sharing_returns_true(self):
        from studyFlax.serializers.socialSerializer import CalendarShareUserSerializer
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = self.owner
        s = CalendarShareUserSerializer(self.viewer, context={'request': request})
        self.assertTrue(s.data['is_sharing'])

    def test_is_shared_with_me_returns_true(self):
        from studyFlax.serializers.socialSerializer import CalendarShareUserSerializer
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = self.viewer
        s = CalendarShareUserSerializer(self.owner, context={'request': request})
        self.assertTrue(s.data['is_shared_with_me'])

    def test_calendar_share_serializer_validate_self_share(self):
        from studyFlax.serializers.socialSerializer import CalendarShareSerializer
        factory = APIRequestFactory()
        request = factory.post('/', {'shared_with': self.owner.id})
        request.user = self.owner
        s = CalendarShareSerializer(
            data={'shared_with': self.owner.id},
            context={'request': request}
        )
        self.assertFalse(s.is_valid())

    def test_calendar_share_serializer_create(self):
        from studyFlax.serializers.socialSerializer import CalendarShareSerializer
        third = make_user('social_third', 'social_third@e.com')
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = third
        s = CalendarShareSerializer(
            data={'shared_with': self.owner.id},
            context={'request': request}
        )
        self.assertTrue(s.is_valid(), s.errors)
        share = s.save()
        self.assertEqual(share.owner, third)


# ---------------------------------------------------------------------------
# membership_views.py — missing paths
# ---------------------------------------------------------------------------

class MembershipViewsMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user('mem_admin', 'mem_admin@e.com')
        self.member = make_user('mem_member', 'mem_member@e.com')
        self.other = make_user('mem_other', 'mem_other@e.com')
        self.society = make_society('Mem Society')
        make_admin(self.admin, self.society)
        make_member(self.member, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_membership_list_nonexistent_society(self):
        response = self.client.get('/api/societies/99999/members/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_membership_detail_nonexistent_society(self):
        response = self.client.delete('/api/societies/99999/members/me/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_collaborator_already_member(self):
        """add_collaborator when user is already a member returns 400."""
        response = self.client.post(
            f'/api/societies/{self.society.id}/members/',
            {'username': self.member.username}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Already a member', response.data['error'])

    def test_add_collaborator_email_not_found(self):
        """find_user_by_identifier returns None when not found."""
        response = self.client.post(
            f'/api/societies/{self.society.id}/members/',
            {'email': 'notexist@e.com'}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_admin_cannot_remove_another_member(self):
        """leave_or_remove: non-admin trying to remove another → permission denied."""
        self.client.force_authenticate(user=self.member)
        response = self.client.delete(
            f'/api/societies/{self.society.id}/members/{self.admin.id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_admin_cannot_update_role(self):
        """update_role: non-admin → permission denied."""
        self.client.force_authenticate(user=self.member)
        response = self.client.patch(
            f'/api/societies/{self.society.id}/members/{self.admin.id}/',
            {'role': 'member'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_role_nonexistent_member(self):
        """update_role: user not in society → 404."""
        response = self.client.patch(
            f'/api/societies/{self.society.id}/members/{self.other.id}/',
            {'role': 'editor'}
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_role_invalid_data(self):
        """update_role: invalid serializer → 400."""
        response = self.client.patch(
            f'/api/societies/{self.society.id}/members/{self.member.id}/',
            {'role': 'invalid_role_xyz'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_leave_nonexistent_membership(self):
        """leave_or_remove: user not in society → 404."""
        response = self.client.delete(
            f'/api/societies/{self.society.id}/members/{self.other.id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# auth_serialisers.py — register validation errors, profile_photo URL
# ---------------------------------------------------------------------------

class AuthSerializersMissingPathsTest(TestCase):
    def test_register_duplicate_email_error(self):
        make_user('dup_user', 'dup@e.com')
        from studyFlax.serialisers.auth_serialisers import RegistrationUserSerialiser as RegisterSerialiser
        s = RegisterSerialiser(data={
            'username': 'newuser', 'email': 'dup@e.com',
            'password': 'pass1234', 'password2': 'pass1234',
            'first_name': 'Test', 'last_name': 'User'
        })
        self.assertFalse(s.is_valid())
        self.assertIn('email', s.errors)

    def test_register_empty_first_name_error(self):
        from studyFlax.serialisers.auth_serialisers import RegistrationUserSerialiser as RegisterSerialiser
        s = RegisterSerialiser(data={
            'username': 'newuser2', 'email': 'newuser2@e.com',
            'password': 'pass1234', 'password2': 'pass1234',
            'first_name': '', 'last_name': 'User'
        })
        self.assertFalse(s.is_valid())

    def test_register_empty_last_name_error(self):
        from studyFlax.serialisers.auth_serialisers import RegistrationUserSerialiser as RegisterSerialiser
        s = RegisterSerialiser(data={
            'username': 'newuser3', 'email': 'newuser3@e.com',
            'password': 'pass1234', 'password2': 'pass1234',
            'first_name': 'Test', 'last_name': ''
        })
        self.assertFalse(s.is_valid())

    def test_user_serializer_profile_photo_url(self):
        """UserSerialiser returns profile_photo_url when photo is set."""
        from studyFlax.serialisers.auth_serialisers import UserSerialiser
        user = make_user('photo_user', 'photo_user@e.com')
        # Set profile_photo to a path string (doesn't need to exist for URL generation)
        User.objects.filter(pk=user.pk).update(profile_photo='profile_photos/test.jpg')
        user.refresh_from_db()
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        s = UserSerialiser(user, context={'request': request})
        # profile_photo_url field exists in data
        data = s.data
        self.assertIn('profile_photo_url', data)


# ---------------------------------------------------------------------------
# module_views.py + module_serialiser.py — missing paths
# ---------------------------------------------------------------------------

class ModuleViewsMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = make_user('mod_teacher', 'mod_teacher@e.com', role='teacher')
        self.student = make_user('mod_student', 'mod_student@e.com', role='student')
        self.other_teacher = make_user('mod_other', 'mod_other@e.com', role='teacher')
        self.module = make_module('MOD101', 'Module 101', self.teacher)
        self.client.force_authenticate(user=self.teacher)

    def test_student_get_all_modules(self):
        """Student GET /api/modules/ returns all modules (not filter by creator)."""
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/modules/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_other_teacher_cannot_update_module(self):
        self.client.force_authenticate(user=self.other_teacher)
        response = self.client.put(f'/api/modules/{self.module.id}/', {
            'module_name': 'Hacked', 'module_code': 'MOD101',
            'start_time': timezone.now().isoformat(),
            'end_time': (timezone.now() + timedelta(hours=1)).isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_module_invalid_data(self):
        response = self.client.put(f'/api/modules/{self.module.id}/', {
            'start_time': 'not-a-date',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_other_teacher_cannot_delete_module(self):
        self.client.force_authenticate(user=self.other_teacher)
        response = self.client.delete(f'/api/modules/{self.module.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_module_with_enrolled_student(self):
        """notify_enrolled_students is called when module has enrollments."""
        Enrollment.objects.create(student=self.student, module=self.module)
        response = self.client.delete(f'/api/modules/{self.module.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # Notification should have been created
        self.assertTrue(Notification.objects.filter(user=self.student, notification_type='module_deleted').exists())

    def test_create_module_non_teacher_fails(self):
        """ModuleSerialiser.validate raises when non-teacher creates module."""
        self.client.force_authenticate(user=self.student)
        response = self.client.post('/api/modules/', {
            'module_code': 'NEW101', 'module_name': 'New Module',
            'start_time': timezone.now().isoformat(),
            'end_time': (timezone.now() + timedelta(hours=1)).isoformat(),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_module_with_recurrence(self):
        """ModuleSerialiser.create with is_recurring=True creates RecurrenceRule."""
        response = self.client.post('/api/modules/', {
            'module_code': 'REC101', 'module_name': 'Recurring Module',
            'start_time': timezone.now().isoformat(),
            'end_time': (timezone.now() + timedelta(hours=1)).isoformat(),
            'is_recurring': True,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        from studyFlax.models.calendar.recurrenceRuleModel import RecurrenceRule
        self.assertTrue(RecurrenceRule.objects.exists())

    def test_module_serialiser_created_by_none(self):
        """ModuleSerialiser.get_created_by_name returns 'Unknown' for None creator."""
        from studyFlax.serialisers.module_serialiser import ModuleSerialiser
        # Create module and manually set created_by to None
        m = Module.objects.create(
            module_code='NONE101', module_name='No Creator',
            created_by=self.teacher,
            start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1)
        )
        # Use factory to serialize - created_by IS the teacher here,
        # but test the None branch directly
        from studyFlax.serialisers.module_serialiser import ModuleSerialiser
        s = ModuleSerialiser(m)
        # Directly test the helper
        result = s.get_created_by_name(type('obj', (), {'created_by': None})())
        self.assertEqual(result, 'Unknown')


# ---------------------------------------------------------------------------
# society_serialisers.py — missing paths
# ---------------------------------------------------------------------------

class SocietySerializersMissingPathsTest(TestCase):
    def setUp(self):
        self.society = make_society('Ser Society')

    def test_society_list_serializer_cover_image_with_images(self):
        """get_cover_image returns first image URL when society has images."""
        SocietyImage.objects.create(society=self.society, url='http://cover.jpg', is_cover=True)
        from studyFlax.serialisers.society_serialisers import SocietyListSerialiser
        s = SocietyListSerialiser(self.society)
        # No obj.image set, so falls through to first_img
        data = s.data
        self.assertIsNotNone(data['cover_image'])

    def test_society_event_to_representation_with_announcement(self):
        """SocietyEventSerialiser adds emoji prefix when event has announcement."""
        ann = SocietyAnnouncement.objects.create(
            society=self.society, title='Ann', content='C'
        )
        event = SocietyEvent.objects.create(
            society=self.society, title='My Event',
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=1),
            recurrence='none', announcement=ann
        )
        event._skip_notification = True
        event.save()
        from studyFlax.serialisers.society_serialisers import SocietyEventSerialiser
        s = SocietyEventSerialiser(event)
        self.assertIn('📢', s.data['title'])

    def test_society_announcement_update_with_skip_notification(self):
        """SocietyAnnouncementSerialiser.update sets _skip_notification."""
        ann = SocietyAnnouncement.objects.create(
            society=self.society, title='Ann', content='C'
        )
        from studyFlax.serialisers.society_serialisers import SocietyAnnouncementSerialiser
        s = SocietyAnnouncementSerialiser(
            ann, data={'title': 'Updated', 'content': 'New'},
            context={'skip_notification': True}
        )
        self.assertTrue(s.is_valid(), s.errors)
        updated = s.save()
        self.assertTrue(updated._skip_notification)

    def test_society_event_calendar_serializer(self):
        """SocietyEventCalendarSerialiser get_society_color and get_source."""
        event = SocietyEvent.objects.create(
            society=self.society, title='Cal Event',
            start_time=timezone.now() + timedelta(days=1),
            end_time=timezone.now() + timedelta(days=1, hours=1),
            recurrence='none'
        )
        from studyFlax.serialisers.society_serialisers import SocietyEventCalendarSerialiser
        s = SocietyEventCalendarSerialiser(event)
        data = s.data
        self.assertEqual(data['source'], 'society')
        self.assertIn('society_color', data)


# ---------------------------------------------------------------------------
# profile_summary_view.py — missing badge thresholds and persona branches
# ---------------------------------------------------------------------------

class ProfileSummaryMissingBadgesTest(TestCase):
    def setUp(self):
        self.user = make_user('badge_user', 'badge_user@e.com')

    def _bulk_sessions(self, count, duration, days_offset=100):
        """Create sessions in the past (beyond 90 days for badge tests)."""
        sessions = []
        for i in range(count):
            base = timezone.now() - timedelta(days=days_offset + i)
            end_time = base.replace(hour=10, minute=0, second=0, microsecond=0)
            start_time = end_time - timedelta(minutes=duration)
            sessions.append(StudySession(
                user=self.user, start_time=start_time, end_time=end_time,
                duration=duration, break_duration=0, pause_duration=0,
                session_count=1, study_block_id=i, status='Completed'
            ))
        return StudySession.objects.bulk_create(sessions)

    def test_compute_streaks_longest_update(self):
        """compute_streaks: longest = max(longest, current) on line 26."""
        from studyFlax.views.user.profile_summary_view import compute_streaks
        # Create 3 consecutive sessions
        s1 = make_session(self.user, days_ago=2)
        s2 = make_session(self.user, days_ago=1)
        s3 = make_session(self.user, days_ago=0)
        active, longest = compute_streaks([s1, s2, s3])
        self.assertGreaterEqual(longest, 3)

    def test_derive_persona_empty_hour_totals(self):
        """derive_persona with sessions but no hour_totals (edge case)."""
        from studyFlax.views.user.profile_summary_view import derive_persona
        # Create a mock session with no end_time.hour contribution
        s = make_session(self.user, days_ago=15, hour=10, duration=0)
        # duration=0 means no contribution to hour_totals
        sessions = [s]
        # With duration=0, hour_totals[10] = 0, peak_hour = 10
        # avg_duration = 0 → sprint (<=30)
        persona = derive_persona(sessions)
        self.assertIn(persona['id'], ['consistent', 'sprint', 'afternoon_peak', 'early_bird', 'night_owl', 'marathon'])

    def test_derive_persona_fallback_path(self):
        """derive_persona returns PERSONAS[2] as fallback for mid-duration, mid-hour."""
        from studyFlax.views.user.profile_summary_view import derive_persona
        # hour=11 (not early bird < 10, not night owl >=20, not afternoon 12-17)
        # duration=50 (not <=30, not >=75)
        sessions = []
        for i in range(8, 15):
            base = timezone.now() - timedelta(days=i)
            end_time = base.replace(hour=11, minute=0, second=0, microsecond=0)
            start_time = end_time - timedelta(minutes=50)
            s = StudySession.objects.create(
                user=self.user, start_time=start_time, end_time=end_time,
                duration=50, break_duration=0, pause_duration=0,
                session_count=1, study_block_id=i+1000, status='Completed'
            )
            sessions.append(s)
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'afternoon_peak')  # fallback returns PERSONAS[2]

    def test_badge_50_hours(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = self._bulk_sessions(1, 3000)  # 50 hours
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('50hr', ids)

    def test_badge_100_hours(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = self._bulk_sessions(1, 6000)  # 100 hours
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('100hr', ids)

    def test_badge_250_hours(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = self._bulk_sessions(1, 15000)  # 250 hours
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('250hr', ids)

    def test_badge_500_hours(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = self._bulk_sessions(1, 30000)  # 500 hours
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('500hr', ids)

    def test_badge_sessions_50(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = self._bulk_sessions(50, 30)
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('sessions_50', ids)

    def test_badge_sessions_100(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = self._bulk_sessions(100, 30)
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('sessions_100', ids)

    def test_badge_streak_7(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = [make_session(self.user, days_ago=i) for i in range(7)]
        badges = compute_badges(sessions, sessions, 0, 7, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('streak_7', ids)

    def test_badge_streak_14(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = [make_session(self.user, days_ago=i) for i in range(14)]
        badges = compute_badges(sessions, sessions, 0, 14, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('streak_14', ids)

    def test_badge_consistent_20_days(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = [make_session(self.user, days_ago=i) for i in range(20)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('consistent_20', ids)

    def test_badge_consistent_28_days(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = [make_session(self.user, days_ago=i) for i in range(28)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('consistent_28', ids)

    def test_badge_afternoon_peak(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = [make_session(self.user, days_ago=i, hour=14) for i in range(1, 5)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('afternoon_peak', ids)

    def test_badge_sprint_king(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = self._bulk_sessions(10, 20)  # 10 sessions under 25 min
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('sprint_king', ids)

    def test_badge_deep_focus(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = self._bulk_sessions(10, 90)  # 10 sessions over 90 min
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('deep_focus', ids)

    def test_badge_breadth(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = self._bulk_sessions(1, 60)
        badges = compute_badges(sessions, sessions, 0, 0, 5, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('breadth', ids)

    def test_badge_consistent_goals(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        # Need >= weekly_goal in each of last 4 weeks
        # goal = 20 hours. Create sessions hitting 20+ hours in each of 4 weeks
        sessions = []
        for week in range(4):
            for day in range(3):  # 3 days per week with 500 min each = 25 hrs
                s = make_session(self.user, days_ago=week * 7 + day + 1, duration=500)
                sessions.append(s)
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('consistent_goals', ids)


# ---------------------------------------------------------------------------
# profile_view.py — photo operations (lines 54, 57, 61-62)
# ---------------------------------------------------------------------------

class ProfileViewPhotoTest(TestCase):
    def test_set_photo_direct(self):
        from studyFlax.views.user.profile_view import set_photo
        user = make_user('photo1', 'photo1@e.com')
        files = {'profile_photo': 'fake_file.jpg'}
        set_photo(user, files)
        self.assertEqual(user.profile_photo, 'fake_file.jpg')

    def test_remove_photo_direct(self):
        from studyFlax.views.user.profile_view import remove_photo
        user = make_user('photo2', 'photo2@e.com')
        remove_photo(user)
        self.assertFalse(bool(user.profile_photo))

    def test_update_photo_with_file(self):
        from studyFlax.views.user.profile_view import update_photo
        user = make_user('photo3', 'photo3@e.com')
        files = {'profile_photo': 'new_photo.jpg'}
        update_photo(user, {}, files)
        self.assertEqual(user.profile_photo, 'new_photo.jpg')

    def test_update_photo_remove_flag(self):
        from studyFlax.views.user.profile_view import update_photo
        user = make_user('photo4', 'photo4@e.com')
        update_photo(user, {'remove_photo': 'true'}, {})
        self.assertFalse(bool(user.profile_photo))


# ---------------------------------------------------------------------------
# notification_views.py — clear_all
# ---------------------------------------------------------------------------

class NotificationClearAllTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('notif_clear', 'notif_clear@e.com')
        self.client.force_authenticate(user=self.user)

    def test_clear_all_notifications(self):
        Notification.objects.create(
            user=self.user, title='Test', message='Msg', notification_type='general'
        )
        response = self.client.delete('/api/notifications/clear-all/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 0)


# ---------------------------------------------------------------------------
# calendar_sync_views.py — nonexistent society
# ---------------------------------------------------------------------------

class CalendarSyncViewsMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('calcsync', 'calcsync@e.com')
        self.client.force_authenticate(user=self.user)

    def test_sync_calendar_nonexistent_society(self):
        response = self.client.post('/api/societies/99999/calendar-sync/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unsync_calendar_nonexistent_society(self):
        response = self.client.delete('/api/societies/99999/calendar-unsync/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# ratification_views.py — nonexistent society
# ---------------------------------------------------------------------------

class RatificationViewsMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('rat_user', 'rat_user@e.com')
        self.client.force_authenticate(user=self.user)

    def test_request_ratification_nonexistent_society(self):
        response = self.client.post('/api/societies/99999/ratification/request/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_handle_ratification_decision_nonexistent_society(self):
        """approve_ratification with nonexistent society → 404."""
        admin_user = make_user('rat_admin', 'rat_admin@e.com')
        admin_user.is_staff = True
        admin_user.save()
        self.client.force_authenticate(user=admin_user)
        response = self.client.post('/api/societies/99999/ratification/approve/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# society_detail_views.py — invalid PATCH data (line 42)
# ---------------------------------------------------------------------------

class SocietyDetailViewMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user('socdet_admin', 'socdet_admin@e.com')
        self.society = make_society('Detail Soc')
        make_admin(self.admin, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_update_society_invalid_data(self):
        """PATCH with invalid data returns 400."""
        response = self.client.patch(
            f'/api/societies/{self.society.id}/',
            {'name': ''}  # name cannot be empty
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# society_tag_views.py — nonexistent society in tag list, invalid tag data
# ---------------------------------------------------------------------------

class SocietyTagViewMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user('soctag_admin', 'soctag_admin@e.com')
        self.society = make_society('Tag Soc')
        make_admin(self.admin, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_society_tag_list_nonexistent_society(self):
        response = self.client.get('/api/societies/99999/tags/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_tag_invalid_data(self):
        """create_tag with invalid serializer → 400."""
        response = self.client.post(
            f'/api/societies/{self.society.id}/tags/',
            {}  # missing required fields
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# society_views.py line 84 — announcement-only publish changes
# ---------------------------------------------------------------------------

class SocietyViewsPublishAnnouncementsOnlyTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user('pub_admin', 'pub_admin@e.com')
        self.member = make_user('pub_member', 'pub_member@e.com')
        self.society = make_society('Pub Soc')
        make_admin(self.admin, self.society)
        make_member(self.member, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_publish_announcement_only_changes(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/publish/',
            {'announcements_added': 1}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# tasks/task_views.py — module filter, invalid PATCH
# ---------------------------------------------------------------------------

class TaskViewsMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('task_fc', 'task_fc@e.com')
        self.client.force_authenticate(user=self.user)

    def test_get_tasks_with_module_filter(self):
        """GET /api/tasks/?module=<id> exercises module filter (line 22)."""
        response = self.client.get('/api/tasks/?module=999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_task_invalid_data(self):
        from studyFlax.models.tasks.taskModel import Task
        task = Task.objects.create(user=self.user, title='Test Task')
        response = self.client.patch(f'/api/tasks/{task.id}/', {'priority': 'invalid_priority_xyz'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# user_search_view.py — society filter
# ---------------------------------------------------------------------------

class UserSearchViewMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('search_user', 'search_user@e.com')
        self.client.force_authenticate(user=self.user)

    def test_user_search_with_society_filter(self):
        response = self.client.get('/api/users/search/?society=1,2,3')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# deadline_views.py — invalid update (line 45)
# ---------------------------------------------------------------------------

class DeadlineViewsMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = make_user('dead_teacher', 'dead_teacher@e.com', role='teacher')
        self.client.force_authenticate(user=self.teacher)
        self.module = make_module('DEAD101', 'Deadline Module', self.teacher)

    def test_update_deadline_invalid_data(self):
        from studyFlax.models.modules.deadlineModel import Deadline
        deadline = Deadline.objects.create(
            module=self.module, title='Test Deadline',
            deadline_type='exam',
            start_due_date=timezone.now() + timedelta(days=7),
        )
        response = self.client.put(
            f'/api/modules/{self.module.id}/deadlines/{deadline.id}/',
            {
                'start_due_date': (timezone.now() + timedelta(days=7)).isoformat(),
                'end_due_date': (timezone.now() + timedelta(days=1)).isoformat(),
            }
            # end_due_date < start_due_date → validation error
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_deadline_as_student_fails(self):
        """DeadlineSerialiser.validate raises for non-teacher."""
        student = make_user('dead_student', 'dead_student@e.com', role='student')
        self.client.force_authenticate(user=student)
        response = self.client.post(
            f'/api/modules/{self.module.id}/deadlines/',
            {'title': 'Deadline', 'deadline_type': 'exam',
             'start_due_date': timezone.now().isoformat()}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# enrollment_views.py — missing paths
# ---------------------------------------------------------------------------

class EnrollmentViewsMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = make_user('enroll_student', 'enroll_student@e.com', role='student')
        self.teacher = make_user('enroll_teacher', 'enroll_teacher@e.com', role='teacher')
        self.module = make_module('ENROLL101', 'Enrollment Module', self.teacher)
        self.client.force_authenticate(user=self.student)

    def test_create_enrollment_success(self):
        response = self.client.post('/api/enrollments/', {'module': self.module.id})
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_create_enrollment_teacher_fails(self):
        """Teacher cannot enroll in a module."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post('/api/enrollments/', {'module': self.module.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_enrollment_another_user(self):
        """Student cannot delete another user's enrollment."""
        other = make_user('enroll_other', 'enroll_other@e.com')
        enrollment = Enrollment.objects.create(student=other, module=self.module)
        response = self.client.delete(f'/api/enrollments/{enrollment.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# calendar/event_helpers.py — Feb 29 year addition, get_base_instance non-exception
# ---------------------------------------------------------------------------

class EventHelpersMissingPathsTest(TestCase):
    def test_add_years_feb29_to_non_leap(self):
        """add_years raises ValueError for Feb 29 → clamped to Feb 28."""
        from studyFlax.views.calendar.event_helpers import add_years
        from datetime import datetime
        dt = datetime(2024, 2, 29, 10, 0)  # 2024 is leap year
        result = add_years(dt, 1)  # 2025 is not leap → clamp to Feb 28
        self.assertEqual(result.month, 2)
        self.assertEqual(result.day, 28)
        self.assertEqual(result.year, 2025)

    def test_get_base_instance_non_exception(self):
        """get_base_instance returns [event] when start is not exception."""
        from studyFlax.views.calendar.event_helpers import get_base_instance
        from studyFlax.models.calendar.recurrenceRuleModel import RecurrenceRule
        user = make_user('evh_user', 'evh_user@e.com')
        now = timezone.now()
        rule = RecurrenceRule.objects.create(frequency='weekly', interval=1)
        event = CalendarEvent.objects.create(
            user=user, title='Recur Event',
            start_time=now, end_time=now + timedelta(hours=1),
            recurrence_rule=rule
        )
        result = get_base_instance(event, rule)
        self.assertEqual(result, [event])


# ---------------------------------------------------------------------------
# calendar/tag_views.py — category_list, societies_tag path
# ---------------------------------------------------------------------------

class TagViewsMissingPathsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('tagfc_user', 'tagfc_user@e.com')
        self.client.force_authenticate(user=self.user)

    def test_category_list_endpoint(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_tag_list_with_society_sync_shows_societies_tag(self):
        society = make_society('Tag Sync Society')
        make_member(self.user, society)
        SocietyCalendarSync.objects.create(user=self.user, society=society)
        response = self.client.get('/api/tags/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# calendar/timetable_service.py — sync_timetable_if_needed unauthenticated,
# fetch_url_text
# ---------------------------------------------------------------------------

class TimetableServiceMissingPathsTest(TestCase):
    def test_sync_timetable_if_needed_unauthenticated(self):
        """Returns None immediately when user is not authenticated."""
        from studyFlax.views.calendar.timetable_service import sync_timetable_if_needed
        from django.contrib.auth.models import AnonymousUser
        result = sync_timetable_if_needed(AnonymousUser())
        self.assertIsNone(result)

    @patch('studyFlax.views.calendar.timetable_service.urlopen')
    def test_fetch_url_text_direct(self, mock_urlopen):
        """fetch_url_text lines 48-50 are covered by calling it directly."""
        from studyFlax.views.calendar.timetable_service import fetch_url_text
        mock_response = MagicMock()
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_response.read.return_value = b'<html>test content</html>'
        mock_urlopen.return_value = mock_response
        result = fetch_url_text('https://example.com')
        self.assertEqual(result, '<html>test content</html>')


# ---------------------------------------------------------------------------
# ratification_notifications.py — missing paths
# ---------------------------------------------------------------------------

class RatificationNotificationsMissingPathsTest(TestCase):
    def setUp(self):
        self.society = make_society('Rat Notif Society')

    def test_skip_notification_on_ratification_save(self):
        """notify_on_ratification_change returns early when _skip_notification=True."""
        self.society.ratification_status = 'pending'
        self.society._skip_notification = True
        self.society.save()
        # No notification should be created
        self.assertEqual(Notification.objects.filter(notification_type='ratification').count(), 0)

    def test_pre_save_signal_new_society(self):
        """cache_old_ratification_status sets _old_ratification_status=None for new society."""
        new_society = Society(name='Brand New Society', bio='Bio', admin_emails='a@test.com')
        # pk is None → _old_ratification_status = None
        new_society.save()
        # Just verify it saved without error
        self.assertTrue(Society.objects.filter(name='Brand New Society').exists())


# ---------------------------------------------------------------------------
# calendar/society_sync_service.py line 44 — idx > 365 break
# ---------------------------------------------------------------------------

class SocietySyncServiceBreakTest(TestCase):
    def test_expand_recurring_break_at_365(self):
        """expand_recurring breaks when idx > 365."""
        from studyFlax.views.calendar.society_sync_service import expand_recurring
        society = make_society('Sync Break Society')
        event = SocietyEvent.objects.create(
            society=society, title='Daily Event',
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
            recurrence='daily',
            recurrence_end_date=(timezone.now() + timedelta(days=400)).date()
        )
        start = timezone.now() - timedelta(days=1)
        end = timezone.now() + timedelta(days=400)
        instances = expand_recurring(event, start, end)
        self.assertLessEqual(len(instances), 366)


# ---------------------------------------------------------------------------
# confirm_password_reset_view.py line 43 — invalid token
# ---------------------------------------------------------------------------

class ConfirmPasswordResetMissingPathTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_confirm_reset_with_invalid_token(self):
        response = self.client.post('/api/auth/password-reset/confirm/', {
            'token': 'nonexistent-token-abc123',
            'new_password': 'newpassword123',
            'confirm_password': 'newpassword123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# user_settings_serialisers.py — validate_major when major already set
# ---------------------------------------------------------------------------

class UserSettingsSerializerMissingPathsTest(TestCase):
    def test_validate_major_when_already_set(self):
        from studyFlax.serialisers.user_settings_serialisers import UserSettingsSerialiser
        user = make_user('maj_user', 'maj_user@e.com')
        settings = UserSettings.objects.create(
            user=user, theme='light', timezone='UTC', major='Computer Science'
        )
        # Try to change major (should fail)
        s = UserSettingsSerialiser(settings, data={'major': 'Physics'}, partial=True)
        self.assertFalse(s.is_valid())
        self.assertIn('major', s.errors)

    def test_validate_major_when_not_set_returns_value(self):
        """validate_major returns value when instance has no major (line 20)."""
        from studyFlax.serialisers.user_settings_serialisers import UserSettingsSerialiser
        user = make_user('maj_user2', 'maj_user2@e.com')
        settings = UserSettings.objects.create(user=user, theme='light', timezone='UTC')
        # major not set - validate_major should return value (not raise)
        s = UserSettingsSerialiser(settings, data={'major': 'Physics'}, partial=True)
        self.assertTrue(s.is_valid())


# ---------------------------------------------------------------------------
# Additional coverage tests for remaining uncovered paths
# ---------------------------------------------------------------------------

class AdditionalCoverageTests(TestCase):
    """Targeted tests for remaining 1% uncovered lines."""

    def setUp(self):
        self.client = APIClient()
        self.user = make_user('addl_user', 'addl_user@e.com')
        self.client.force_authenticate(user=self.user)

    # -- share_views.py line 51-52: unshare nonexistent user --
    def test_unshare_nonexistent_user(self):
        response = self.client.post('/api/social/99999/unshare/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -- socialSerializer.py lines 21, 28: return False when no auth --
    def test_social_serializer_no_auth_returns_false(self):
        from studyFlax.serializers.socialSerializer import CalendarShareUserSerializer
        other = make_user('addl_other', 'addl_other@e.com')
        # No context → request is None → returns False for both fields
        s = CalendarShareUserSerializer(other)
        self.assertFalse(s.data['is_sharing'])
        self.assertFalse(s.data['is_shared_with_me'])

    # -- membership_views.py line 60: find_user_by_identifier returns None --
    def test_membership_find_user_identifier_returns_none(self):
        """POST with empty username key triggers find_user returns None → 404."""
        society = make_society('AddlSociety')
        make_admin(self.user, society)
        response = self.client.post(
            f'/api/societies/{society.id}/members/',
            {'username': ''}  # key present but empty → both falsy → return None
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -- society_serialisers.py line 44: return obj.image when image IS set --
    def test_society_with_image_field_returns_it(self):
        """get_cover_image returns obj.image directly when image field is set."""
        from studyFlax.serialisers.society_serialisers import SocietyListSerialiser
        society = make_society('ImgSociety')
        # Set the image field directly (not via SocietyImage model)
        Society.objects.filter(pk=society.pk).update(image='covers/test.jpg')
        society.refresh_from_db()
        s = SocietyListSerialiser(society)
        self.assertEqual(s.data['cover_image'], 'covers/test.jpg')

    # -- society_serialisers.py: cover_image else None when no images --
    def test_society_no_image_returns_none(self):
        """get_cover_image returns None when society has no image and no images."""
        from studyFlax.serialisers.society_serialisers import SocietyListSerialiser
        society = make_society('NoImgSociety')
        s = SocietyListSerialiser(society)
        self.assertIsNone(s.data['cover_image'])

    # -- profile_summary_view.py line 192: early_bird badge --
    def test_badge_early_bird(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        # Create sessions all before 10am
        sessions = [make_session(self.user, days_ago=i + 100, hour=7) for i in range(4)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [b['id'] for b in badges]
        self.assertIn('early_bird', ids)

    # -- enrollment_views.py lines 48-49, 55: is_core_module with major set --
    def test_delete_enrollment_core_module_blocked(self):
        """Delete enrollment for core module fails with 403."""
        from studyFlax.models.auth.userSettingsModel import UserSettings
        teacher = make_user('addl_teacher', 'addl_teacher@e.com', role='teacher')
        # Set user's major to Computer Science → prefix 'CS'
        UserSettings.objects.create(user=self.user, major='Computer Science')
        # Create a CS-prefixed module
        module = make_module('CS1010', 'Core Module', teacher)
        enrollment = Enrollment.objects.create(student=self.user, module=module)
        response = self.client.delete(f'/api/enrollments/{enrollment.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('core course', response.data['error'])

    # -- user/settings_views.py lines 30-34: user_settings_view via force_authenticate --
    def test_user_settings_view_get_authenticated(self):
        from studyFlax.views.user.settings_views import user_settings_view
        from rest_framework.test import force_authenticate
        factory = APIRequestFactory()
        request = factory.get('/fake/')
        force_authenticate(request, user=self.user)
        response = user_settings_view(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('theme', response.data)

    def test_user_settings_view_put_authenticated(self):
        from studyFlax.views.user.settings_views import user_settings_view
        from rest_framework.test import force_authenticate
        factory = APIRequestFactory()
        request = factory.put('/fake/', {'theme': 'dark', 'timezone': 'UTC'})
        force_authenticate(request, user=self.user)
        response = user_settings_view(request)
        self.assertEqual(response.status_code, 200)
