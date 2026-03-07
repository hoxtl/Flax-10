from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from studyFlax.models.auth.userSettingsModel import UserSettings
from studyFlax.models.modules.moduleModel import Module
from studyFlax.models.modules.enrollmentModel import Enrollment

User = get_user_model()


def make_user(username='settuser', email='sett@example.com'):
    return User.objects.create_user(username=username, email=email, password='pass')


def make_module(module_code, module_name, creator):
    now = timezone.now()
    return Module.objects.create(
        module_code=module_code,
        module_name=module_name,
        created_by=creator,
        start_time=now,
        end_time=now + timedelta(hours=1),
    )


class UserSettingsViewTest(TestCase):
    """Tests for user_settings_view (GET/PATCH /api/settings/)."""

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_get_settings_creates_defaults(self):
        response = self.client.get('/api/settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('theme', response.data)
        self.assertIn('timezone', response.data)

    def test_get_settings_returns_existing(self):
        UserSettings.objects.create(user=self.user, theme='dark', timezone='UTC')
        response = self.client.get('/api/settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['theme'], 'dark')
        self.assertEqual(response.data['timezone'], 'UTC')

    def test_patch_updates_theme(self):
        response = self.client.patch('/api/settings/', {'theme': 'dark'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['settings']['theme'], 'dark')

    def test_patch_updates_timezone(self):
        response = self.client.patch('/api/settings/', {'timezone': 'America/New_York'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['settings']['timezone'], 'America/New_York')

    def test_patch_partial_theme_only(self):
        UserSettings.objects.create(user=self.user, theme='light', timezone='Europe/London')
        response = self.client.patch('/api/settings/', {'theme': 'dark'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['settings']['theme'], 'dark')

    def test_unauthenticated_denied(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/settings/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class OnboardingViewTest(TestCase):
    """Tests for onboarding_view (POST /api/onboarding/)."""

    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_onboarding_missing_year(self):
        response = self.client.post('/api/onboarding/', {'major': 'Computer Science'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('year', response.data['error'])

    def test_onboarding_missing_major(self):
        response = self.client.post('/api/onboarding/', {'year': '1'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('major', response.data['error'])

    def test_onboarding_missing_both(self):
        response = self.client.post('/api/onboarding/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_onboarding_success_saves_settings(self):
        response = self.client.post('/api/onboarding/', {'year': '2', 'major': 'Computer Science'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['year'], '2')
        self.assertEqual(response.data['major'], 'Computer Science')
        settings = UserSettings.objects.get(user=self.user)
        self.assertEqual(settings.year, '2')
        self.assertEqual(settings.major, 'Computer Science')

    def test_onboarding_enrolls_modules(self):
        # Create a module matching a known major prefix for Computer Science
        make_module('6CCS3AIN', 'AI', self.user)
        response = self.client.post('/api/onboarding/', {'year': '3', 'major': 'Computer Science'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('enrolled_modules', response.data)
        self.assertGreaterEqual(response.data['enrolled_modules'], 0)

    def test_onboarding_unknown_major_no_enrollments(self):
        response = self.client.post('/api/onboarding/', {'year': '1', 'major': 'Underwater Basket Weaving'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['enrolled_modules'], 0)

    def test_onboarding_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/onboarding/', {'year': '1', 'major': 'CS'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_onboarding_idempotent(self):
        """Calling onboarding twice should not crash."""
        self.client.post('/api/onboarding/', {'year': '1', 'major': 'Computer Science'})
        response = self.client.post('/api/onboarding/', {'year': '2', 'major': 'Computer Science'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class GetModulesForMajorTest(TestCase):
    """Unit tests for get_modules_for_major."""

    def setUp(self):
        self.creator = make_user('gm_creator', 'gm_creator@e.com')

    def test_unknown_major_returns_empty(self):
        from studyFlax.views.user.settings_views import get_modules_for_major
        result = get_modules_for_major('Nonexistent Major')
        self.assertEqual(result, [])

    def test_known_major_returns_matching_modules(self):
        from studyFlax.views.user.settings_views import get_modules_for_major
        make_module('6CCS3AIN', 'AI', self.creator)
        result = get_modules_for_major('Computer Science')
        self.assertIsInstance(result, list)

    def test_empty_prefix_list_returns_empty(self):
        from studyFlax.views.user.settings_views import get_modules_for_major
        # Major with no prefix in course_to_module_prefixes returns []
        result = get_modules_for_major('')
        self.assertEqual(result, [])


class EnrollUserInModulesTest(TestCase):
    """Unit tests for enroll_user_in_modules."""

    def setUp(self):
        self.user = make_user()

    def test_enrolls_modules(self):
        from studyFlax.views.user.settings_views import enroll_user_in_modules
        m1 = make_module('AAA101', 'Module A', self.user)
        m2 = make_module('BBB101', 'Module B', self.user)
        count = enroll_user_in_modules(self.user, [m1, m2])
        self.assertEqual(count, 2)
        self.assertEqual(Enrollment.objects.filter(student=self.user).count(), 2)

    def test_no_double_enroll(self):
        from studyFlax.views.user.settings_views import enroll_user_in_modules
        m = make_module('CCC101', 'Module C', self.user)
        enroll_user_in_modules(self.user, [m])
        # Second call should not create duplicate
        count = enroll_user_in_modules(self.user, [m])
        self.assertEqual(count, 0)
        self.assertEqual(Enrollment.objects.filter(student=self.user, module=m).count(), 1)
