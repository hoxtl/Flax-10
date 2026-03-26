"""
Backend tests for profile summary helper functions.
"""

from datetime import timedelta
import uuid

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from studyFlax.models.timer.session_model import StudySession


User = get_user_model()


class ProfileSummaryHelpersTest(TestCase):
    """Tests for derived summary helpers in profile summary."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='helperuser', email='helper@example.com', password='pass'
        )

    def test_profile_summary_no_sessions_returns_default_persona(self):
        from studyFlax.views.user.profile_summary_badges import derive_persona

        persona = derive_persona([])
        self.assertEqual(persona['id'], 'night_owl')

    def test_derive_persona_early_bird(self):
        from studyFlax.views.user.profile_summary_badges import derive_persona

        sessions = [self._make_session(days_ago=index, hour=7) for index in range(8, 15)]
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'early_bird')

    def test_derive_persona_afternoon_peak(self):
        from studyFlax.views.user.profile_summary_badges import derive_persona

        sessions = [self._make_session(days_ago=index, hour=14) for index in range(8, 15)]
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'afternoon_peak')

    def test_derive_persona_consistent(self):
        from studyFlax.views.user.profile_summary_badges import derive_persona

        sessions = [self._make_session(days_ago=index, hour=10) for index in range(0, 6)]
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'consistent')

    def test_derive_persona_sprint(self):
        from studyFlax.views.user.profile_summary_badges import derive_persona

        sessions = [self._make_session(days_ago=index, hour=10, duration=20 * 60) for index in range(8, 15)]
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'sprint')

    def test_derive_persona_marathon(self):
        from studyFlax.views.user.profile_summary_badges import derive_persona

        sessions = [self._make_session(days_ago=index, hour=10, duration=100 * 60) for index in range(8, 15)]
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'marathon')

    def test_compute_badges_hours_milestones(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        sessions = [self._make_session(i + 1, duration=3600, days_ago=i * 24 + 1) for i in range(1, 12)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [badge['id'] for badge in badges]
        self.assertIn('1hr', ids)
        self.assertIn('10hr', ids)

    def test_compute_badges_streak(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        sessions = [self._make_session(index + 1, duration=60, days_ago=index + 1) for index in range(3)]
        badges = compute_badges(sessions, sessions, 3, 3, 0, self.user)
        ids = [badge['id'] for badge in badges]
        self.assertIn('streak_3', ids)

    def test_compute_badges_incomplete_sessions_are_excluded(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        incomplete = self._make_session(1, status_val='Incomplete')
        badges = compute_badges([incomplete], [incomplete], 0, 0, 0, self.user)
        ids = [badge['id'] for badge in badges]
        self.assertNotIn('sessions_1', ids)

    def test_compute_badges_50hr_and_100hr_milestones(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        sessions = [self._make_session(index + 1, days_ago=index + 1, duration=480 * 60) for index in range(13)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [badge['id'] for badge in badges]
        self.assertIn('50hr', ids)
        self.assertIn('100hr', ids)

    def test_compute_badges_250hr_and_500hr_milestones(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        sessions = [self._make_session(index + 1, days_ago=index + 1, duration=310 * 60) for index in range(100)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [badge['id'] for badge in badges]
        self.assertIn('250hr', ids)
        self.assertIn('500hr', ids)

    def test_compute_badges_sessions_50_and_100(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        sessions = [self._make_session(index + 1, days_ago=index + 1) for index in range(100)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [badge['id'] for badge in badges]
        self.assertIn('sessions_50', ids)
        self.assertIn('sessions_100', ids)

    def test_compute_badges_streak_14(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        sessions = [self._make_session(index + 1, days_ago=index + 1) for index in range(14)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [badge['id'] for badge in badges]
        self.assertIn('streak_14', ids)

    def test_compute_badges_streak_30(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        sessions = [self._make_session(index + 1, days_ago=index + 1) for index in range(30)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [badge['id'] for badge in badges]
        self.assertIn('streak_30', ids)

    def test_compute_badges_consistent_20_and_28(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        sessions = [self._make_session(index, hours_ago=index * 24 + 1) for index in range(29)]
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [badge['id'] for badge in badges]
        self.assertIn('consistent_20', ids)
        self.assertIn('consistent_28', ids)

    def test_compute_badges_early_bird_and_afternoon_peak(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        early_sessions = [self._make_session(index + 1, hour=7, days_ago=index + 1) for index in range(10)]
        early_badges = compute_badges(early_sessions, early_sessions, 0, 0, 0, self.user)
        early_ids = [badge['id'] for badge in early_badges]
        self.assertIn('early_bird', early_ids)

        afternoon_sessions = [self._make_session(index + 30, hour=14, days_ago=index + 1) for index in range(10)]
        afternoon_badges = compute_badges(afternoon_sessions, afternoon_sessions, 0, 0, 0, self.user)
        afternoon_ids = [badge['id'] for badge in afternoon_badges]
        self.assertIn('afternoon_peak', afternoon_ids)

    def test_compute_badges_sprint_king_and_deep_focus(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        short = [self._make_session(index + 1, duration=20 * 60) for index in range(10)]
        short_badges = compute_badges(short, short, 0, 0, 0, self.user)
        short_ids = [badge['id'] for badge in short_badges]
        self.assertIn('sprint_king', short_ids)

        long_session = [self._make_session(index + 20, duration=100 * 60) for index in range(10)]
        long_badges = compute_badges(long_session, long_session, 0, 0, 0, self.user)
        long_ids = [badge['id'] for badge in long_badges]
        self.assertIn('deep_focus', long_ids)

    def test_compute_badges_breadth_for_multiple_modules(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        sessions = [self._make_session(index + 1, hours_ago=index + 1) for index in range(5)]
        badges = compute_badges(sessions, sessions, 0, 0, 5, self.user)
        ids = [badge['id'] for badge in badges]
        self.assertIn('breadth', ids)

    def test_compute_badges_consistent_goals_for_four_weeks(self):
        from studyFlax.views.user.profile_summary_badges import compute_badges

        sessions = []
        for week in range(4):
            for day in range(5):
                sessions.append(self._make_session(week * 7 + day + 1, duration=3600))
        self.user.weekly_goal_hours = 1
        self.user.save()
        badges = compute_badges(sessions, sessions, 0, 0, 0, self.user)
        ids = [badge['id'] for badge in badges]
        self.assertIn('consistent_goals', ids)

    def test_compute_streaks_for_broken_streak(self):
        from studyFlax.views.analytics.session_analytics_service import compute_streaks

        sessions = [self._make_session(5)]
        current, longest = compute_streaks(sessions)
        self.assertEqual(current, 0)
        self.assertGreater(longest, 0)

    def test_compute_streaks_broken_streak_returns_zero(self):
        from studyFlax.views.analytics.session_analytics_service import compute_streaks

        sessions = [self._make_session(6), self._make_session(8)]
        current, longest = compute_streaks(sessions)
        self.assertEqual(current, 0)

    def test_get_weekly_study_hours(self):
        from studyFlax.views.user.profile_summary_badges import get_weekly_study_hours

        self._make_session(days_ago=1, duration=7200)
        self._make_session(days_ago=2, duration=3600)
        self._make_session(days_ago=3, duration=3600)
        sessions = list(StudySession.objects.filter(user=self.user))
        self.assertAlmostEqual(get_weekly_study_hours(sessions), 4.0, places=1)

    def test_persona_fallback_for_medium_late_morning_duration(self):
        from studyFlax.views.user.profile_summary_badges import derive_persona

        sessions = [self._make_session(index + 8, hour=10, duration=45 * 60) for index in range(7)]
        persona = derive_persona(sessions)
        self.assertEqual(persona['id'], 'afternoon_peak')

    def _make_session(self, index=0, status_val='Completed', days_ago=None, hour=10, duration=3600, hours_ago=None):
        if days_ago is None and hours_ago is None:
            days_ago = index
        if hours_ago is not None:
            base_time = timezone.now() - timedelta(hours=hours_ago)
        else:
            base_time = timezone.now() - timedelta(days=days_ago)
        end_time = base_time.replace(hour=hour, minute=0, second=0, microsecond=0)
        start_time = end_time - timedelta(seconds=duration)
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


class AddSessionToTotalsTest(TestCase):
    """Tests add session to totals."""
    def test_returns_early_when_session_has_no_end_time(self):
        from studyFlax.views.user.profile_summary_payload import add_session_to_totals
        from unittest.mock import MagicMock
        from django.utils import timezone
        today = timezone.localdate()
        totals = {today: 0}
        session = MagicMock()
        session.end_time = None
        add_session_to_totals(totals, session)
        self.assertEqual(totals[today], 0)
