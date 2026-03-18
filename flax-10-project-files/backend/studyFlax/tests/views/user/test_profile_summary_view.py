"""
Backend tests for the profile summary endpoint.
"""

import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.modules.enrollment_model import Enrollment
from studyFlax.models.modules.module_model import Module
from studyFlax.models.society.society_image_model import SocietyImage
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.models.society.society_model import Society
from studyFlax.models.social.share_model import CalendarShare
from studyFlax.models.timer.session_model import StudySession
from studyFlax.tests.helpers.factories import make_session

User = get_user_model()


class ProfileSummaryEndpointTest(TestCase):
    """Tests for profile summary endpoint behaviour."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='pass',
            first_name='Test', last_name='User'
        )
        self.client.force_authenticate(user=self.user)

    def test_empty_profile_summary(self):
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('persona', response.data)
        self.assertIn('badges', response.data)
        self.assertIn('streaks', response.data)
        self.assertIn('weekly', response.data)
        self.assertIn('activity_sparkline', response.data)
        self.assertIn('mutual_connections', response.data)

    def test_summary_with_sessions(self):
        for index in range(5):
            make_session(self.user, duration=60, hours_ago=index * 24 + 1)
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['badges']), 0)

    def test_summary_computes_streaks(self):
        for days in range(3, 0, -1):
            make_session(self.user, duration=60, hours_ago=days * 24)
        response = self.client.get('/api/profile/summary/')
        self.assertGreaterEqual(response.data['streaks']['longest'], 1)

    def test_weekly_goal_percentage_updates(self):
        self.user.weekly_goal_hours = 10
        self.user.save()
        make_session(self.user, duration=600, hours_ago=1)
        response = self.client.get('/api/profile/summary/')
        self.assertGreater(response.data['weekly']['percentage'], 0)

    def test_badges_include_sessions_ten_when_many(self):
        for index in range(12):
            make_session(self.user, duration=60, hours_ago=index * 2 + 1)
        response = self.client.get('/api/profile/summary/')
        badge_ids = [item['id'] for item in response.data['badges']]
        self.assertIn('sessions_10', badge_ids)

    def test_other_user_summary_is_retrievable(self):
        other = User.objects.create_user(
            username='other', email='other@example.com', password='pass'
        )
        response = self.client.get(f'/api/profile/summary/?user_id={other.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_other_user_not_found_returns_404(self):
        response = self.client.get('/api/profile/summary/?user_id=99999')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_summary_includes_seven_day_activity_sparkline(self):
        make_session(self.user, duration=30, hours_ago=5)
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        points = response.data['activity_sparkline']
        self.assertEqual(len(points), 7)
        self.assertTrue(all('level' in item and 'date' in item for item in points))

    def test_summary_builds_mutual_connections_for_viewer(self):
        viewed = User.objects.create_user(
            username='viewed', email='viewed@example.com', password='pass'
        )
        mutual = User.objects.create_user(
            username='mutual', email='mutual@example.com', password='pass'
        )
        CalendarShare.objects.create(owner=self.user, shared_with=mutual)
        CalendarShare.objects.create(owner=viewed, shared_with=mutual)
        response = self.client.get(f'/api/profile/summary/?user_id={viewed.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mutuals = response.data['mutual_connections']
        self.assertEqual(mutuals['count'], 1)
        self.assertEqual(mutuals['users'][0]['username'], 'mutual')

    def test_incomplete_sessions_not_counted_for_badges(self):
        self._make_session(status_val='Incomplete', duration=120)
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_persona_is_night_owl_for_late_hours(self):
        end = timezone.now().replace(hour=22, minute=0) - timedelta(days=1)
        start = end - timedelta(minutes=60)
        for _ in range(5):
            StudySession.objects.create(
                user=self.user, start_time=start, end_time=end, duration=60,
                break_duration=0, pause_duration=0, status='Completed',
                study_block_id=random.randint(1, 999999), session_count=1
            )
        response = self.client.get('/api/profile/summary/')
        self.assertIn('id', response.data['persona'])

    def test_summary_reflects_enrolled_modules(self):
        for index in range(3):
            module = Module.objects.create(
                module_code=f'CS10{index}',
                module_name=f'Module {index}',
                created_by=self.user,
                start_time=timezone.now(),
                end_time=timezone.now(),
            )
            Enrollment.objects.create(student=self.user, module=module)
        response = self.client.get('/api/profile/summary/')
        badge_ids = [item['id'] for item in response.data['badges']]
        self.assertIn('multi_module', badge_ids)

    def test_summary_requires_authentication(self):
        response = APIClient().get('/api/profile/summary/')
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_society_image_uses_direct_field(self):
        society = Society.objects.create(
            name='DirectImg', bio='b', admin_emails='a@b.com',
            image='http://example.com/direct.jpg'
        )
        SocietyMembership.objects.create(user=self.user, society=society, role='member')
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        society_payload = next(
            item for item in response.data['societies'] if item['id'] == society.id
        )
        self.assertEqual(society_payload['image'], 'http://example.com/direct.jpg')

    def test_society_image_uses_society_image_record(self):
        society = Society.objects.create(
            name='FallbackImg', bio='b', admin_emails='a@b.com'
        )
        SocietyMembership.objects.create(user=self.user, society=society, role='member')
        SocietyImage.objects.create(society=society, url='http://example.com/img.jpg')
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        society_payload = next(
            item for item in response.data['societies'] if item['id'] == society.id
        )
        self.assertEqual(society_payload['image'], 'http://example.com/img.jpg')

    def test_society_image_is_none_when_unavailable(self):
        society = Society.objects.create(
            name='NoImg', bio='b', admin_emails='a@b.com'
        )
        SocietyMembership.objects.create(user=self.user, society=society, role='member')
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        society_payload = next(
            item for item in response.data['societies'] if item['id'] == society.id
        )
        self.assertIsNone(society_payload['image'])

    def test_teacher_profile_uses_created_module_count(self):
        teacher = User.objects.create_user(
            username='teach_prof', email='teach_prof@example.com',
            password='pass', first_name='Dr', last_name='Smith', role='teacher',
        )
        self.client.force_authenticate(user=teacher)
        Module.objects.create(
            module_code='CS999',
            module_name='Advanced AI',
            created_by=teacher,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
        )
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['societies'], [])

    def test_teacher_profile_has_no_societies(self):
        teacher = User.objects.create_user(
            username='teach_soc', email='teach_soc@example.com',
            password='pass', first_name='Dr', last_name='Jones', role='teacher',
        )
        self.client.force_authenticate(user=teacher)
        society = Society.objects.create(name='TeachSoc', bio='bio', admin_emails='a@b.com')
        SocietyMembership.objects.create(user=teacher, society=society, role='member')
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['societies'], [])

    def _make_session(self, **kwargs):
        return StudySession.objects.create(
            user=self.user,
            start_time=timezone.now() - timedelta(hours=1),
            end_time=timezone.now(),
            duration=kwargs.get('duration', 60),
            break_duration=0,
            pause_duration=0,
            status=kwargs.get('status_val', 'Completed'),
            study_block_id=random.randint(1, 999999),
            session_count=1,
        )
