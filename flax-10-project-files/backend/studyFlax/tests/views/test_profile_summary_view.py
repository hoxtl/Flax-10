import random
import uuid
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.modules.enrollmentModel import Enrollment
from studyFlax.models.modules.moduleModel import Module
from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyMembershipModel import SocietyMembership
from studyFlax.models.society.societyImageModel import SocietyImage

User = get_user_model()


def make_session(user, duration=60, status_val='Completed', hours_ago=2):
    end = timezone.now() - timedelta(hours=hours_ago)
    start = end - timedelta(minutes=duration)
    return StudySession.objects.create(
        user=user, start_time=start, end_time=end,
        duration=duration, break_duration=10, pause_duration=0, status=status_val,
        study_block_id=random.randint(1, 999999), session_count=1
    )


class ProfileSummaryViewTest(TestCase):
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

    def test_summary_with_sessions(self):
        for i in range(5):
            make_session(self.user, duration=60, hours_ago=i * 24 + 1)
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['badges']), 0)

    def test_streak_computed(self):
        for i in range(3, 0, -1):
            make_session(self.user, hours_ago=i * 24)
        response = self.client.get('/api/profile/summary/')
        self.assertGreaterEqual(response.data['streaks']['longest'], 1)

    def test_weekly_goal_percentage(self):
        self.user.weekly_goal_hours = 10
        self.user.save()
        make_session(self.user, duration=600, hours_ago=1)
        response = self.client.get('/api/profile/summary/')
        self.assertGreater(response.data['weekly']['percentage'], 0)

    def test_badges_with_many_sessions(self):
        for i in range(12):
            make_session(self.user, duration=60, hours_ago=i * 2 + 1)
        response = self.client.get('/api/profile/summary/')
        badge_ids = [b['id'] for b in response.data['badges']]
        self.assertIn('sessions_10', badge_ids)

    def test_other_user_summary(self):
        other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        response = self.client.get(f'/api/profile/summary/?user_id={other.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_other_user_not_found(self):
        response = self.client.get('/api/profile/summary/?user_id=99999')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_incomplete_sessions_excluded_from_badges(self):
        make_session(self.user, status_val='Incomplete', duration=120)
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_persona_night_owl(self):
        end = timezone.now().replace(hour=22, minute=0) - timedelta(days=1)
        start = end - timedelta(minutes=60)
        for _ in range(5):
            StudySession.objects.create(
                user=self.user, start_time=start, end_time=end,
                duration=60, break_duration=0, pause_duration=0, status='Completed',
                study_block_id=random.randint(1, 999999), session_count=1
            )
        response = self.client.get('/api/profile/summary/')
        self.assertIn('id', response.data['persona'])

    def test_with_module_enrollments(self):
        for i in range(3):
            module = Module.objects.create(
                module_code=f'CS10{i}', module_name=f'Module {i}',
                created_by=self.user, start_time=timezone.now(), end_time=timezone.now()
            )
            Enrollment.objects.create(student=self.user, module=module)
        response = self.client.get('/api/profile/summary/')
        badge_ids = [b['id'] for b in response.data['badges']]
        self.assertIn('multi_module', badge_ids)

    def test_unauthenticated(self):
        response = APIClient().get('/api/profile/summary/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_society_image_direct_field(self):
        """get_society_image returns society.image when set directly."""
        society = Society.objects.create(
            name='DirectImg', bio='b', admin_emails='a@b.com',
            image='http://example.com/direct.jpg'
        )
        SocietyMembership.objects.create(user=self.user, society=society, role='member')
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        society_data = next(s for s in response.data['societies'] if s['id'] == society.id)
        self.assertEqual(society_data['image'], 'http://example.com/direct.jpg')

    def test_society_image_fallback_via_society_image(self):
        """get_society_image falls back to the first SocietyImage URL when society.image is blank."""
        society = Society.objects.create(name='FallbackImg', bio='b', admin_emails='a@b.com')
        SocietyMembership.objects.create(user=self.user, society=society, role='member')
        SocietyImage.objects.create(society=society, url='http://example.com/img.jpg')
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        society_data = next(s for s in response.data['societies'] if s['id'] == society.id)
        self.assertEqual(society_data['image'], 'http://example.com/img.jpg')

    def test_society_image_none_when_no_images(self):
        """get_society_image returns None when society has no image at all."""
        society = Society.objects.create(name='NoImg', bio='b', admin_emails='a@b.com')
        SocietyMembership.objects.create(user=self.user, society=society, role='member')
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        society_data = next(s for s in response.data['societies'] if s['id'] == society.id)
        self.assertIsNone(society_data['image'])

    def test_early_bird_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona

        sessions = [self._make_session_for_persona(days_ago=i, hour=7, duration=60) for i in range(8, 15)]
        persona = derive_persona(sessions)

        self.assertEqual(persona['id'], 'early_bird')

    def test_afternoon_peak_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona

        sessions = [self._make_session_for_persona(days_ago=i, hour=14, duration=60) for i in range(8, 15)]
        persona = derive_persona(sessions)

        self.assertEqual(persona['id'], 'afternoon_peak')

    def test_consistent_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona

        sessions = [self._make_session_for_persona(days_ago=i, hour=10, duration=60) for i in range(0, 6)]
        persona = derive_persona(sessions)

        self.assertEqual(persona['id'], 'consistent')

    def test_sprint_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona

        sessions = [self._make_session_for_persona(days_ago=i, hour=10, duration=20) for i in range(8, 15)]
        persona = derive_persona(sessions)

        self.assertEqual(persona['id'], 'sprint')

    def test_marathon_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona

        sessions = [self._make_session_for_persona(days_ago=i, hour=10, duration=100) for i in range(8, 15)]
        persona = derive_persona(sessions)

        self.assertEqual(persona['id'], 'marathon')

    def test_no_sessions_returns_first_persona(self):
        from studyFlax.views.user.profile_summary_view import derive_persona

        persona = derive_persona([])
        self.assertEqual(persona['id'], 'night_owl')

    def test_profile_summary_no_sessions(self):
        response = self.client.get('/api/profile/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['streaks']['current'], 0)
        self.assertEqual(response.data['badges'], [])

    def test_compute_badges_hours_milestones(self):
        from studyFlax.views.user.profile_summary_view import compute_badges

        sessions = [make_session(self.user, duration=60, hours_ago=i * 24 + 1) for i in range(1, 12)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)

        self.assertIn('1hr', [badge['id'] for badge in badges])
        self.assertIn('10hr', [badge['id'] for badge in badges])

    def test_compute_badges_streak(self):
        from studyFlax.views.user.profile_summary_view import compute_badges

        sessions = [make_session(self.user, duration=60, hours_ago=i * 24 + 1) for i in range(3)]
        badges = compute_badges(sessions, sessions, 3, 3, 0, self.user)

        self.assertIn('streak_3', [badge['id'] for badge in badges])

    def test_compute_badges_incomplete_sessions_excluded(self):
        from studyFlax.views.user.profile_summary_view import compute_badges

        incomplete = self._make_session_for_persona(days_ago=1, status_val='Incomplete')
        badges = compute_badges([incomplete], [incomplete], 0, 0, 0, self.user)

        self.assertNotIn('sessions_1', [badge['id'] for badge in badges])

    def test_get_weekly_study_hours(self):
        from studyFlax.views.user.profile_summary_view import get_weekly_study_hours

        self._make_session_for_persona(days_ago=0, duration=120)
        self._make_session_for_persona(days_ago=1, duration=60)
        self._make_session_for_persona(days_ago=10, duration=300)
        sessions = list(StudySession.objects.filter(user=self.user))

        self.assertAlmostEqual(get_weekly_study_hours(sessions), 3.0, places=1)

    def _make_session_for_persona(self, days_ago=0, hour=10, duration=60, status_val='Completed'):
        base = timezone.now() - timedelta(days=days_ago)
        end_time = base.replace(hour=hour, minute=0, second=0, microsecond=0)
        start_time = end_time - timedelta(minutes=duration)
        return StudySession.objects.create(
            user=self.user,
            start_time=start_time,
            end_time=end_time,
            duration=duration,
            break_duration=0,
            pause_duration=0,
            status=status_val,
            study_block_id=uuid.uuid4().int % 1000000,
            session_count=1,
        )
