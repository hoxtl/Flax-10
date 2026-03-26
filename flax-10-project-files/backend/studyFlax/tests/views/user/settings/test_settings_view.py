"""
Backend tests for settings views extended.
"""

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.test import APIRequestFactory
from rest_framework import status

from studyFlax.models.authentication.user_settings_model import UserSettings
from studyFlax.serialisers.user.user_settings_serialisers import UserSettingsSerialiser
from studyFlax.models.modules.enrollment_model import Enrollment
from studyFlax.views.user.settings_view import user_settings_view as legacy_user_settings_view
from studyFlax.tests.helpers.test_model_builders import make_user, make_module
from rest_framework.test import force_authenticate


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

    def test_get_or_create_user_settings_uses_default_timezone(self):
        from studyFlax.views.user.settings_view import get_or_create_user_settings

        settings = get_or_create_user_settings(self.user)
        self.assertEqual(settings.timezone, 'Europe/London')

    def test_patch_valid_password_updates_password(self):
        response = self.client.patch('/api/settings/', {'password': 'newpassword123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))

    def test_patch_updates_name_fields(self):
        response = self.client.patch(
            '/api/settings/',
            {'first_name': 'New', 'last_name': 'User'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'New')
        self.assertEqual(self.user.last_name, 'User')

    def test_patch_short_password_returns_400(self):
        response = self.client.patch('/api/settings/', {'password': 'short'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_email_updates_user_email(self):
        response = self.client.patch('/api/settings/', {'email': 'new@example.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'new@example.com')

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
        self.client.post('/api/onboarding/', {'year': '1', 'major': 'Computer Science'})
        response = self.client.post('/api/onboarding/', {'year': '2', 'major': 'Computer Science'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class GetModulesForMajorTest(TestCase):
    """Unit tests for get_modules_for_major."""

    def setUp(self):
        self.creator = make_user('gm_creator', 'gm_creator@e.com')

    def test_unknown_major_returns_empty(self):
        from studyFlax.views.user.settings_view import get_modules_for_major
        result = get_modules_for_major('Nonexistent Major')
        self.assertEqual(result, [])

    def test_known_major_returns_matching_modules(self):
        from studyFlax.views.user.settings_view import get_modules_for_major
        make_module('6CCS3AIN', 'AI', self.creator)
        result = get_modules_for_major('Computer Science')
        self.assertIsInstance(result, list)

    def test_empty_prefix_list_returns_empty(self):
        from studyFlax.views.user.settings_view import get_modules_for_major
        result = get_modules_for_major('')
        self.assertEqual(result, [])

class EnrollUserInModulesTest(TestCase):
    """Unit tests for enroll_user_in_modules."""

    def setUp(self):
        self.user = make_user()

    def test_enrolls_modules(self):
        from studyFlax.views.user.settings_view import enroll_user_in_modules
        m1 = make_module('AAA101', 'Module A', self.user)
        m2 = make_module('BBB101', 'Module B', self.user)
        count = enroll_user_in_modules(self.user, [m1, m2])
        self.assertEqual(count, 2)
        self.assertEqual(Enrollment.objects.filter(student=self.user).count(), 2)

    def test_no_double_enroll(self):
        from studyFlax.views.user.settings_view import enroll_user_in_modules
        m = make_module('CCC101', 'Module C', self.user)
        enroll_user_in_modules(self.user, [m])
        count = enroll_user_in_modules(self.user, [m])
        self.assertEqual(count, 0)
        self.assertEqual(Enrollment.objects.filter(student=self.user, module=m).count(), 1)

class LegacyUserSettingsViewTests(TestCase):
    """Directly exercise helper-based settings endpoints."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = make_user()

    def call_legacy_view(self, method, url, data=None, format=None):
        kwargs = {}
        if data is not None:
            kwargs['data'] = data
        if format is not None:
            kwargs['format'] = format
        request = getattr(self.factory, method)(url, **kwargs)
        force_authenticate(request, user=self.user)
        return legacy_user_settings_view(request)

    def test_get_creates_default_settings(self):
        response = self.call_legacy_view('get', '/api/user/settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['theme'], 'light')
        self.assertEqual(response.data['timezone'], 'Europe/London')

    def test_patch_updates_timezone(self):
        response = self.call_legacy_view(
            'patch',
            '/api/user/settings/',
            {'timezone': 'America/New_York'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['timezone'], 'America/New_York')

    def test_patch_updates_theme_only(self):
        response = self.call_legacy_view(
            'patch',
            '/api/user/settings/',
            {'theme': 'dark'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['theme'], 'dark')

    def test_patch_locked_major_returns_400(self):
        UserSettings.objects.create(user=self.user, major='Physics', theme='light', timezone='Europe/London')
        response = self.call_legacy_view('patch', '/api/user/settings/', {'major': 'Biochemistry'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_settings_view_rejects_locked_major(self):
        UserSettings.objects.create(user=self.user, major='Physics', theme='light', timezone='Europe/London')
        api_client = APIClient()
        api_client.force_authenticate(user=self.user)
        response = api_client.patch('/api/settings/', {'major': 'Biochemistry'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class UserSettingsSerializerTests(TestCase):
    """Unit tests for UserSettingsSerialiser validation and computed fields."""

    def setUp(self):
        self.user = make_user()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_major_change_blocked_when_already_set(self):
        settings = UserSettings.objects.create(
            user=self.user,
            major='Physics',
            theme='light',
            timezone='Europe/London'
        )
        serializer = UserSettingsSerialiser(
            instance=settings,
            data={'major': 'Biochemistry'},
            partial=True
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('major', serializer.errors)

    def test_major_locked_reflects_field_presence(self):
        settings = UserSettings.objects.create(
            user=self.user,
            theme='light',
            timezone='Europe/London'
        )
        serializer = UserSettingsSerialiser(instance=settings)
        self.assertFalse(serializer.data['major_locked'])

        locked_user = make_user('lock_user', 'lock@example.com')
        locked_settings = UserSettings.objects.create(
            user=locked_user,
            major='Math',
            theme='light',
            timezone='Europe/London'
        )
        locked_serializer = UserSettingsSerialiser(instance=locked_settings)
        self.assertTrue(locked_serializer.data['major_locked'])

    def test_preferred_study_minutes_can_be_updated(self):
        settings = UserSettings.objects.create(
            user=self.user,
            theme='light',
            timezone='Europe/London'
        )
        serializer = UserSettingsSerialiser(
            instance=settings,
            data={'preferred_study_minutes_per_day': 180},
            partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.preferred_study_minutes_per_day, 180)

    def test_patch_updates_preferred_study_minutes(self):
        response = self.client.patch(
            '/api/settings/',
            {'preferred_study_minutes_per_day': 180},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['settings']['preferred_study_minutes_per_day'], 180)

    def test_patch_updates_week_preference(self):
        response = self.client.patch(
            '/api/settings/',
            {'week_preference': 'weekdays'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['settings']['week_preference'], 'weekdays')

    def test_patch_updates_worktime_preference(self):
        response = self.client.patch(
            '/api/settings/',
            {'worktime_preference': 'night'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['settings']['worktime_preference'], 'night')
