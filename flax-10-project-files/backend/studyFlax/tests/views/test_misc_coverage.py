"""
Tests for miscellaneous low-coverage areas:
- society/helpers.py (require_society decorator, handle_image_urls)
- society/society_tag_views.py (tag max, update tag, non-admin access)
- calendar/tag_views.py (protected tags, restricted default tags, conditional tag filtering)
- calendar/event_views.py (shared calendar access, private events masking)
- user/profile_summary_view.py (derive_persona variants, badge edge cases)
- serializers: reset_password, task, social
- fixtures/society_fixtures.py
- utils/email_utils.py
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyMembershipModel import SocietyMembership
from studyFlax.models.society.societyTagModel import SocietyTag
from studyFlax.models.society.societyImageModel import SocietyImage
from studyFlax.models import Tag, CalendarEvent
from studyFlax.models.social.shareModel import CalendarShare
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.modules.enrollmentModel import Enrollment

User = get_user_model()


def make_user(username='miscuser', email='misc@example.com'):
    return User.objects.create_user(username=username, email=email, password='pass')


def make_society(name='Misc Society'):
    return Society.objects.create(name=name, bio='Bio', admin_emails='a@test.com')


def make_admin(user, society):
    return SocietyMembership.objects.create(user=user, society=society, role='admin')


def make_member(user, society):
    return SocietyMembership.objects.create(user=user, society=society, role='member')


# ---------------------------------------------------------------------------
# society/helpers.py
# ---------------------------------------------------------------------------

class SocietyHelpersTest(TestCase):
    def setUp(self):
        self.user = make_user()
        self.society = make_society()

    def test_handle_image_urls_replaces_images(self):
        from studyFlax.views.society.helpers import handle_image_urls
        SocietyImage.objects.create(society=self.society, url='http://old.jpg', is_cover=True)
        handle_image_urls(self.society, {'image_urls': ['http://new1.jpg', 'http://new2.jpg']})
        images = SocietyImage.objects.filter(society=self.society)
        self.assertEqual(images.count(), 2)
        urls = list(images.values_list('url', flat=True))
        self.assertIn('http://new1.jpg', urls)

    def test_handle_image_urls_uses_images_key(self):
        from studyFlax.views.society.helpers import handle_image_urls
        handle_image_urls(self.society, {'images': ['http://alt.jpg']})
        self.assertEqual(SocietyImage.objects.filter(society=self.society).count(), 1)

    def test_handle_image_urls_none_does_nothing(self):
        from studyFlax.views.society.helpers import handle_image_urls
        SocietyImage.objects.create(society=self.society, url='http://keep.jpg', is_cover=True)
        handle_image_urls(self.society, {})  # no image_urls or images key
        self.assertEqual(SocietyImage.objects.filter(society=self.society).count(), 1)

    def test_require_society_decorator(self):
        """require_society wraps a view and injects the society."""
        from studyFlax.views.society.helpers import require_society
        from rest_framework.response import Response
        called_with = {}

        def view_func(request, society, *args, **kwargs):
            called_with['society'] = society
            return Response({'ok': True})

        wrapped = require_society(view_func)
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.get('/')
        # Valid society
        response = wrapped(request, self.society.id)
        self.assertEqual(called_with['society'], self.society)

    def test_require_society_decorator_not_found(self):
        from studyFlax.views.society.helpers import require_society
        from rest_framework.response import Response

        def view_func(request, society, *args, **kwargs):
            return Response({'ok': True})

        wrapped = require_society(view_func)
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.get('/')
        response = wrapped(request, 99999)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_is_society_member_false(self):
        from studyFlax.views.society.helpers import is_society_member
        non_member = make_user('nonmember_helper', 'nonmember_helper@e.com')
        self.assertFalse(is_society_member(non_member, self.society))

    def test_is_society_member_true(self):
        from studyFlax.views.society.helpers import is_society_member
        make_member(self.user, self.society)
        self.assertTrue(is_society_member(self.user, self.society))


# ---------------------------------------------------------------------------
# society/society_tag_views.py
# ---------------------------------------------------------------------------

class SocietyTagViewExtendedTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user('stag_admin', 'stag_admin@e.com')
        self.other = make_user('stag_other', 'stag_other@e.com')
        self.society = make_society('Tag View Society')
        make_admin(self.admin, self.society)
        self.client.force_authenticate(user=self.admin)

    def test_update_tag(self):
        tag = SocietyTag.objects.create(society=self.society, label='Old', color='#000')
        response = self.client.patch(
            f'/api/societies/{self.society.id}/tags/{tag.id}/',
            {'label': 'New', 'color': '#fff'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['label'], 'New')

    def test_update_tag_invalid(self):
        tag = SocietyTag.objects.create(society=self.society, label='Old', color='#000')
        response = self.client.patch(
            f'/api/societies/{self.society.id}/tags/{tag.id}/',
            {'label': ''}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_tag_non_admin(self):
        tag = SocietyTag.objects.create(society=self.society, label='Tag', color='#000')
        self.client.force_authenticate(user=self.other)
        response = self.client.patch(
            f'/api/societies/{self.society.id}/tags/{tag.id}/',
            {'label': 'Hack'}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_tag_exceeds_max(self):
        for i in range(7):  # MAX_TAGS = 7
            SocietyTag.objects.create(society=self.society, label=f'Tag{i}', color='#000')
        response = self.client.post(
            f'/api/societies/{self.society.id}/tags/',
            {'label': 'Extra', 'color': '#fff'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Maximum', response.data['error'])

    def test_delete_tag_nonexistent_society(self):
        response = self.client.delete('/api/societies/99999/tags/1/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ---------------------------------------------------------------------------
# calendar/tag_views.py - protected/restricted tag logic
# ---------------------------------------------------------------------------

class TagViewsExtendedTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('tagext_user', 'tagext@e.com')
        self.client.force_authenticate(user=self.user)

    def test_create_tag(self):
        response = self.client.post('/api/tags/', {'name': 'MyTag', 'color': '#abc123', 'default_duration': 30})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_tag_invalid(self):
        response = self.client.post('/api/tags/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_tag_detail(self):
        tag = Tag.objects.create(name='PersonalTag', is_default=False, user=self.user,
                                 color='#abc', default_duration=30)
        response = self.client.get(f'/api/tags/{tag.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_tag_not_found(self):
        response = self.client.get('/api/tags/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_user_tag(self):
        tag = Tag.objects.create(name='DeleteMe', is_default=False, user=self.user,
                                 color='#abc', default_duration=30)
        response = self.client.delete(f'/api/tags/{tag.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_cannot_delete_default_tag(self):
        tag = Tag.objects.create(name='Lecture', is_default=True, user=None,
                                 color='#abc', default_duration=30)
        response = self.client.delete(f'/api/tags/{tag.id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot delete', response.data['error'])

    def test_cannot_rename_protected_tag(self):
        tag = Tag.objects.create(name='Lecture', is_default=True, user=None,
                                 color='#abc', default_duration=30)
        response = self.client.patch(f'/api/tags/{tag.id}/', {'name': 'HackedLecture'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot rename', response.data['error'])

    def test_can_update_icon_on_restricted_default_tag(self):
        # A default tag NOT in PROTECTED_TAGS (non-system)
        tag = Tag.objects.create(name='CustomDefault', is_default=True, user=None,
                                 color='#abc', default_duration=30, icon='🔖')
        response = self.client.patch(f'/api/tags/{tag.id}/', {'icon': '⭐'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['icon'], '⭐')

    def test_only_icon_allowed_on_restricted_default_tag(self):
        tag = Tag.objects.create(name='CustomDefault2', is_default=True, user=None,
                                 color='#abc', default_duration=30)
        response = self.client.patch(f'/api/tags/{tag.id}/', {'color': '#fff'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('icon', response.data['error'])

    def test_update_user_tag(self):
        tag = Tag.objects.create(name='UserTag', is_default=False, user=self.user,
                                 color='#abc', default_duration=30)
        response = self.client.patch(f'/api/tags/{tag.id}/', {'color': '#ffffff'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_tag_list_with_enrollment_shows_system_tags(self):
        from studyFlax.models.modules.moduleModel import Module
        module = Module.objects.create(
            module_code='ZZZ999', module_name='Test Module',
            created_by=self.user, start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1)
        )
        Enrollment.objects.create(student=self.user, module=module)
        Tag.objects.create(name='Lecture', is_default=True, user=None, color='#000', default_duration=60)
        response = self.client.get('/api/tags/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_tag_list_without_enrollment_excludes_system_tags(self):
        Tag.objects.create(name='Lecture', is_default=True, user=None, color='#000', default_duration=60)
        response = self.client.get('/api/tags/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [t['name'] for t in response.data]
        self.assertNotIn('Lecture', names)


# ---------------------------------------------------------------------------
# calendar/event_views.py - shared calendar and private event masking
# ---------------------------------------------------------------------------

class EventViewsSharedCalendarTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = make_user('ev_owner', 'ev_owner@e.com')
        self.viewer = make_user('ev_viewer', 'ev_viewer@e.com')
        self.unrelated = make_user('ev_unrelated', 'ev_unrelated@e.com')
        self.client.force_authenticate(user=self.viewer)

    def _make_event(self, user, title='Event', is_private=False):
        return CalendarEvent.objects.create(
            user=user, title=title,
            start_time=timezone.now() + timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=2),
            is_private=is_private
        )

    def test_get_shared_calendar_events(self):
        CalendarShare.objects.create(owner=self.owner, shared_with=self.viewer)
        self._make_event(self.owner, 'Public Event')
        response = self.client.get(f'/api/events/?user_id={self.owner.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_private_events_masked_for_viewer(self):
        CalendarShare.objects.create(owner=self.owner, shared_with=self.viewer)
        self._make_event(self.owner, 'Secret Event', is_private=True)
        response = self.client.get(f'/api/events/?user_id={self.owner.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Busy')

    def test_unshared_calendar_returns_empty(self):
        self._make_event(self.owner, 'Hidden Event')
        response = self.client.get(f'/api/events/?user_id={self.owner.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_nonexistent_user_returns_empty(self):
        response = self.client.get('/api/events/?user_id=99999')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_own_events_not_masked(self):
        self.client.force_authenticate(user=self.owner)
        self._make_event(self.owner, 'My Secret', is_private=True)
        response = self.client.get('/api/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Own events not masked
        self.assertEqual(response.data[0]['title'], 'My Secret')


# ---------------------------------------------------------------------------
# user/profile_summary_view.py — persona & badge edge cases
# ---------------------------------------------------------------------------

class ProfileSummaryExtendedTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user('ps_user', 'ps_user@e.com')
        self.client.force_authenticate(user=self.user)

    def _make_session(self, days_ago=0, hour=10, duration=60, status_str='Completed'):
        base = timezone.now() - timedelta(days=days_ago)
        end_time = base.replace(hour=hour, minute=0, second=0, microsecond=0)
        start_time = end_time - timedelta(minutes=duration)
        return StudySession.objects.create(
            user=self.user, start_time=start_time, end_time=end_time,
            duration=duration, break_duration=0, pause_duration=0,
            session_count=1, study_block_id=1, status=status_str
        )

    def test_profile_summary_no_sessions(self):
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['streaks']['current'], 0)
        self.assertEqual(response.data['badges'], [])

    def test_profile_summary_with_sessions(self):
        self._make_session(days_ago=0, duration=60)
        self._make_session(days_ago=1, duration=120)
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['streaks']['current'], 1)

    def test_early_bird_persona(self):
        """Many early morning sessions → early_bird persona."""
        from studyFlax.views.user.profile_summary_view import derive_persona
        sessions = []
        for i in range(8, 15):
            s = self._make_session(days_ago=i, hour=7, duration=60)
            sessions.append(s)
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'early_bird')

    def test_night_owl_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona
        sessions = []
        for i in range(8, 15):
            s = self._make_session(days_ago=i, hour=22, duration=60)
            sessions.append(s)
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'night_owl')

    def test_afternoon_peak_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona
        sessions = []
        for i in range(8, 15):
            s = self._make_session(days_ago=i, hour=14, duration=60)
            sessions.append(s)
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'afternoon_peak')

    def test_consistent_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona
        sessions = []
        for i in range(0, 6):  # 6 consecutive days this week
            s = self._make_session(days_ago=i, hour=10, duration=60)
            sessions.append(s)
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'consistent')

    def test_sprint_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona
        sessions = []
        for i in range(8, 15):
            s = self._make_session(days_ago=i, hour=10, duration=20)  # short sessions
            sessions.append(s)
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'sprint')

    def test_marathon_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona
        sessions = []
        for i in range(8, 15):
            s = self._make_session(days_ago=i, hour=10, duration=100)  # long sessions
            sessions.append(s)
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'marathon')

    def test_no_sessions_returns_first_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona
        persona = derive_persona([])
        self.assertEqual(persona['id'], 'night_owl')  # PERSONAS[0]

    def test_profile_summary_for_another_user(self):
        other = make_user('ps_other', 'ps_other@e.com')
        self._make_session(days_ago=0)
        response = self.client.get(f'/api/profile/summary/?user_id={other.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_compute_badges_hours_milestones(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        # Create enough sessions for 10+ hours
        sessions = [self._make_session(days_ago=i, duration=60) for i in range(1, 12)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        badge_ids = [b['id'] for b in badges]
        self.assertIn('1hr', badge_ids)
        self.assertIn('10hr', badge_ids)

    def test_compute_badges_streak(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        sessions = [self._make_session(days_ago=i, duration=60) for i in range(3)]
        badges = compute_badges(sessions, sessions, 3, 3, 0, self.user)
        badge_ids = [b['id'] for b in badges]
        self.assertIn('streak_3', badge_ids)

    def test_compute_badges_incomplete_sessions_excluded(self):
        from studyFlax.views.user.profile_summary_view import compute_badges
        incomplete = self._make_session(days_ago=1, status_str='Incomplete')
        badges = compute_badges([incomplete], [incomplete], 0, 0, 0, self.user)
        badge_ids = [b['id'] for b in badges]
        # Should not have earned any session-based badges
        self.assertNotIn('sessions_1', badge_ids)

    def test_get_weekly_study_hours(self):
        from studyFlax.views.user.profile_summary_view import get_weekly_study_hours
        self._make_session(days_ago=0, duration=120)  # 2 hours
        self._make_session(days_ago=1, duration=60)   # 1 hour
        self._make_session(days_ago=10, duration=300)  # outside week window
        sessions = list(StudySession.objects.filter(user=self.user))
        hours = get_weekly_study_hours(sessions)
        self.assertAlmostEqual(hours, 3.0, places=1)


# ---------------------------------------------------------------------------
# Serializers: reset_password, task, social
# ---------------------------------------------------------------------------

class ResetPasswordSerializerTest(TestCase):
    def test_normalise_email(self):
        from studyFlax.serialisers.reset_password_serialisers import ResetPasswordSerialiser
        s = ResetPasswordSerialiser()
        self.assertEqual(s.normalise_lowercase_email('  TEST@Example.COM  '), 'test@example.com')

    def test_confirm_passwords_match(self):
        from studyFlax.serialisers.reset_password_serialisers import ResetPasswordConfirmSerialiser
        s = ResetPasswordConfirmSerialiser()
        data = {'new_password': 'abc12345', 'confirm_password': 'abc12345', 'token': 'tok'}
        result = s.validate_passwords(data)
        self.assertEqual(result, data)

    def test_confirm_passwords_mismatch(self):
        from studyFlax.serialisers.reset_password_serialisers import ResetPasswordConfirmSerialiser
        from rest_framework.exceptions import ValidationError
        s = ResetPasswordConfirmSerialiser()
        data = {'new_password': 'abc12345', 'confirm_password': 'different', 'token': 'tok'}
        with self.assertRaises(ValidationError):
            s.validate_passwords(data)


class TaskSerializerTest(TestCase):
    def setUp(self):
        self.user = make_user('taskser_user', 'taskser@e.com')

    def test_serializer_marks_completed_at_on_completion(self):
        from studyFlax.serialisers.task_serialisers import TaskSerialiser
        from studyFlax.models.tasks.taskModel import Task
        task = Task.objects.create(user=self.user, title='Test', completed=False)
        s = TaskSerialiser(task, data={'completed': True}, partial=True)
        self.assertTrue(s.is_valid())
        updated = s.save()
        self.assertIsNotNone(updated.completed_at)

    def test_serializer_clears_completed_at_on_reopen(self):
        from studyFlax.serialisers.task_serialisers import TaskSerialiser
        from studyFlax.models.tasks.taskModel import Task
        task = Task.objects.create(
            user=self.user, title='Test', completed=True,
            completed_at=timezone.now()
        )
        s = TaskSerialiser(task, data={'completed': False}, partial=True)
        self.assertTrue(s.is_valid())
        updated = s.save()
        self.assertIsNone(updated.completed_at)

    def test_task_list_serializer_task_count(self):
        from studyFlax.serialisers.task_serialisers import TaskListSerialiser
        from studyFlax.models.tasks.taskModel import TaskList, Task
        tl = TaskList.objects.create(user=self.user, name='Work')
        Task.objects.create(user=self.user, task_list=tl, title='Active')
        Task.objects.create(user=self.user, task_list=tl, title='Done', completed=True)
        s = TaskListSerialiser(tl)
        self.assertEqual(s.data['task_count'], 1)  # only non-completed


class SocialSerializerTest(TestCase):
    def setUp(self):
        self.owner = make_user('social_owner', 'social_owner@e.com')
        self.viewer = make_user('social_viewer', 'social_viewer@e.com')

    def test_calendar_share_serializer(self):
        from studyFlax.serializers.socialSerializer import CalendarShareSerializer
        share = CalendarShare.objects.create(owner=self.owner, shared_with=self.viewer)
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = self.owner
        s = CalendarShareSerializer(share, context={'request': request})
        data = s.data
        self.assertIn('id', data)

    def test_calendar_share_user_serializer(self):
        from studyFlax.serializers.socialSerializer import CalendarShareUserSerializer
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = self.viewer
        s = CalendarShareUserSerializer(self.owner, context={'request': request})
        data = s.data
        self.assertIn('id', data)
        self.assertIn('username', data)


# ---------------------------------------------------------------------------
# fixtures/society_fixtures.py
# ---------------------------------------------------------------------------

class SocietyFixturesTest(TestCase):
    def test_get_events_for_category_sports(self):
        from studyFlax.fixtures.society_fixtures import get_events_for_category
        events = get_events_for_category('sports')
        self.assertIsInstance(events, list)
        self.assertGreater(len(events), 0)

    def test_get_events_for_unknown_category(self):
        from studyFlax.fixtures.society_fixtures import get_events_for_category
        events = get_events_for_category('unknown_category')
        self.assertIsInstance(events, list)
        self.assertGreater(len(events), 0)  # fallback to 'social'

    def test_build_society_seed_data(self):
        from studyFlax.fixtures.society_fixtures import build_society_seed_data
        data = build_society_seed_data()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        first = data[0]
        self.assertIn('name', first)
        self.assertIn('categories', first)
        self.assertIn('events', first)

    def test_build_society_dict(self):
        from studyFlax.fixtures.society_fixtures import build_society_dict
        result = build_society_dict('Test', 'Bio', 'About', 'sports', ['Tag1'])
        self.assertEqual(result['name'], 'Test')
        self.assertIn('sports', result['categories'])  # 'sports' has no mapping, stays as 'sports'

    def test_get_random_category_image(self):
        from studyFlax.fixtures.society_fixtures import get_random_category_image
        img = get_random_category_image('sports')
        self.assertIsInstance(img, str)
        self.assertTrue(img.endswith('.jpg'))

    def test_get_random_category_image_mapped(self):
        from studyFlax.fixtures.society_fixtures import get_random_category_image
        # gaming maps to social
        img = get_random_category_image('gaming')
        self.assertIsInstance(img, str)

    def test_build_event_datetime(self):
        from studyFlax.fixtures.society_fixtures import build_event_datetime
        start, end = build_event_datetime(18, 90, day_of_week=2)
        self.assertIsNotNone(start)
        self.assertIsNotNone(end)
        diff = end - start
        self.assertEqual(diff.seconds // 60, 90)

    def test_build_event_datetime_no_day(self):
        from studyFlax.fixtures.society_fixtures import build_event_datetime
        start, end = build_event_datetime(10, 60, day_of_week=None)
        self.assertIsNotNone(start)

    def test_get_next_occurrence(self):
        from studyFlax.fixtures.society_fixtures import get_next_occurrence
        from datetime import date
        result = get_next_occurrence(0)  # Monday
        self.assertIsInstance(result, date)

    def test_get_next_occurrence_no_day(self):
        from studyFlax.fixtures.society_fixtures import get_next_occurrence
        result = get_next_occurrence(None)
        self.assertIsNotNone(result)


# ---------------------------------------------------------------------------
# utils/email_utils.py
# ---------------------------------------------------------------------------

class EmailUtilsTest(TestCase):
    def setUp(self):
        self.user = make_user('email_user', 'email_user@e.com')

    @patch('studyFlax.utils.email_utils.send_mail')
    @patch('studyFlax.utils.email_utils.render_to_string')
    def test_send_reset_password_email(self, mock_render, mock_send):
        from studyFlax.utils.email_utils import send_reset_password_email
        mock_render.return_value = '<html>Reset</html>'
        send_reset_password_email(self.user, 'http://example.com/reset?token=abc')
        mock_send.assert_called_once()
        call_kwargs = mock_send.call_args[1]
        self.assertIn(self.user.email, call_kwargs['recipient_list'])
        self.assertIn('reset password', call_kwargs['subject'].lower())


# ---------------------------------------------------------------------------
# Serialiser: profile_photo_url and get_has_reported branches
# ---------------------------------------------------------------------------

class SocietyMembershipSerialiserPhotoTest(TestCase):
    def setUp(self):
        from rest_framework.test import APIRequestFactory
        from unittest.mock import MagicMock, PropertyMock, patch
        self.factory = APIRequestFactory()
        self.patch = patch
        self.MagicMock = MagicMock
        self.PropertyMock = PropertyMock

    def test_profile_photo_url_with_request_and_photo(self):
        from studyFlax.serialisers.society_serialisers import SocietyMembershipSerialiser
        from unittest.mock import MagicMock, PropertyMock, patch
        user = User.objects.create_user(username='mphoto', email='mphoto@test.com', password='pass')
        society = Society.objects.create(name='PhotoSoc', bio='b', admin_emails='a@b.com')
        membership = SocietyMembership.objects.create(user=user, society=society, role='member')

        mock_photo = MagicMock()
        mock_photo.url = '/media/profile_photos/test.jpg'
        mock_photo.__bool__ = lambda self: True

        request = self.factory.get('/')
        request.user = user

        with patch.object(type(user), 'profile_photo', new_callable=PropertyMock, return_value=mock_photo):
            serializer = SocietyMembershipSerialiser(membership, context={'request': request})
            url = serializer.data['profile_photo_url']
        self.assertIn('/media/profile_photos/test.jpg', url)


class SocietyDetailSerialiserHasReportedTest(TestCase):
    def test_has_reported_false_without_request(self):
        from studyFlax.serialisers.society_serialisers import SocietyDetailSerialiser
        society = Society.objects.create(name='NoReqSoc', bio='b', admin_emails='a@b.com')
        serializer = SocietyDetailSerialiser(society)
        self.assertFalse(serializer.data['has_reported'])
