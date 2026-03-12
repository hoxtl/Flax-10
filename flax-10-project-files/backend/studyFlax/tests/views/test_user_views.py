"""
Backend tests for user views.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.auth.userSettingsModel import UserSettings
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models.modules.enrollmentModel import Enrollment
from studyFlax.models.modules.moduleModel import Module
from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyMembershipModel import SocietyMembership

User = get_user_model()


class ProfileViewTest(TestCase):
    """Tests for profile view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass', first_name='Test', last_name='User')
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('username', response.data)

    def test_get_profile_with_events(self):
        CalendarEvent.objects.create(user=self.user, title='Test', start_time=timezone.now() + timezone.timedelta(hours=1), end_time=timezone.now() + timezone.timedelta(hours=2))
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('event_count', response.data)

    def test_patch_profile_username(self):
        response = self.client.patch('/api/profile/', {'username': 'newusername'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_same_username(self):
        response = self.client.patch('/api/profile/', {'username': 'testuser'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_taken_username(self):
        User.objects.create_user(username='taken', email='taken@example.com', password='pass')
        response = self.client.patch('/api/profile/', {'username': 'taken'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_profile_bio(self):
        response = self.client.patch('/api/profile/', {'bio': 'Hello world'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_weekly_goal(self):
        response = self.client.patch('/api/profile/', {'weekly_goal_hours': '10'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_remove_photo(self):
        response = self.client.patch('/api/profile/', {'remove_photo': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_profile_upload_photo(self):
        photo = SimpleUploadedFile("photo.jpg", b"fake image content", content_type="image/jpeg")
        response = self.client.patch('/api/profile/', {'profile_photo': photo}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_another_user_profile(self):
        other = User.objects.create_user(username='other', email='other@example.com', password='pass')
        response = self.client.get(f'/api/users/{other.id}/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_another_user_profile_not_found(self):
        response = self.client.get('/api/users/99999/profile/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated(self):
        response = APIClient().get('/api/profile/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class CheckUsernameViewTest(TestCase):
    """Tests for check username view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_username_available(self):
        response = self.client.post('/api/check-username/', {'username': 'brandnew'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['available'])

    def test_username_taken(self):
        User.objects.create_user(username='taken', email='taken@example.com', password='pass')
        response = self.client.post('/api/check-username/', {'username': 'taken'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['available'])

    def test_username_empty(self):
        response = self.client.post('/api/check-username/', {'username': ''})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['available'])

    def test_username_too_short(self):
        response = self.client.post('/api/check-username/', {'username': 'ab'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['available'])

    def test_own_username_available(self):
        response = self.client.post('/api/check-username/', {'username': 'testuser'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['available'])


class UserSearchViewTest(TestCase):
    """Tests for user search view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='searcher', email='searcher@example.com', password='pass')
        self.other = User.objects.create_user(username='findme', email='findme@example.com', password='pass', first_name='John', last_name='Doe')
        self.client.force_authenticate(user=self.user)

    def test_search_by_username(self):
        response = self.client.get('/api/users/search/?q=findme')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_no_query(self):
        response = self.client.get('/api/users/search/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_search_by_first_name(self):
        response = self.client.get('/api/users/search/?q=John')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

    def test_search_excludes_self(self):
        response = self.client.get('/api/users/search/?q=searcher')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_search_pagination(self):
        response = self.client.get('/api/users/search/?offset=0&limit=1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('has_more', response.data)

    def test_search_by_module(self):
        module = Module.objects.create(module_code='CS101', module_name='Intro CS', created_by=self.user, start_time=timezone.now(), end_time=timezone.now())
        Enrollment.objects.create(student=self.other, module=module)
        response = self.client.get('/api/users/search/?module=CS101')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_by_course(self):
        UserSettings.objects.create(user=self.other, theme='light', timezone='Europe/London', major='Computer Science')
        response = self.client.get('/api/users/search/?course=Computer%20Science')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_by_year(self):
        UserSettings.objects.create(user=self.other, theme='light', timezone='Europe/London', year='Year 2')
        response = self.client.get('/api/users/search/?year=Year%202')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class HomeAddressViewTest(TestCase):
    """Tests for home address view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_get_home_address(self):
        response = self.client.get('/api/user/home-address/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('home_address', response.data)

    def test_post_home_address(self):
        response = self.client.post('/api/user/home-address/', {
            'home_address': '10 Downing St', 'home_latitude': 51.5, 'home_longitude': -0.1
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

    def test_post_home_address_empty(self):
        response = self.client.post('/api/user/home-address/', {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UserSettingsViewTest(TestCase):
    """Tests for user settings view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_get_settings(self):
        response = self.client.get('/api/settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_settings_theme(self):
        response = self.client.patch('/api/settings/', {'theme': 'dark', 'timezone': 'Europe/London'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_settings_partial(self):
        response = self.client.patch('/api/settings/', {'theme': 'light'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_put_settings_updates_names(self):
        response = self.client.patch('/api/settings/', {'first_name': 'New', 'last_name': 'Name'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'New')
        self.assertEqual(self.user.last_name, 'Name')

    def test_put_settings_short_password(self):
        response = self.client.patch('/api/settings/', {'password': 'abc'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_put_settings_rejects_locked_major_change(self):
        UserSettings.objects.create(user=self.user, theme='light', timezone='Europe/London', major='Physics')
        response = self.client.patch('/api/settings/', {'major': 'Math'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class OnboardingViewTest(TestCase):
    """Tests for onboarding view."""
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='pass')
        self.client.force_authenticate(user=self.user)

    def test_onboarding_success(self):
        response = self.client.post('/api/onboarding/', {'year': '1', 'major': 'Computer Science'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('enrolled_modules', response.data)

    def test_onboarding_missing_fields(self):
        response = self.client.post('/api/onboarding/', {'year': '1'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_onboarding_unknown_major(self):
        response = self.client.post('/api/onboarding/', {'year': '1', 'major': 'Unknown Major XYZ'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['enrolled_modules'], 0)


class ProfileViewCoverageTest(TestCase):
    """Tests for profile_view update photo branch."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='pv_user', email='pv_user@test.com', password='pass',
            first_name='PV', last_name='User'
        )
        self.client.force_authenticate(user=self.user)

    def test_patch_remove_photo(self):
        response = self.client.patch('/api/profile/', data={'remove_photo': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UserSearchCoverageTest(TestCase):
    """Tests for user_search_view society filter."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='us_user', email='us_user@test.com', password='pass'
        )
        self.other = User.objects.create_user(
            username='us_other', email='us_other@test.com', password='pass'
        )
        self.client.force_authenticate(user=self.user)

    def test_search_by_society(self):
        society = Society.objects.create(name='SearchSoc', bio='bio', admin_emails='a@b.com')
        SocietyMembership.objects.create(user=self.other, society=society, role='member')
        response = self.client.get(f'/api/users/search/?society={society.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [u['id'] for u in response.data['results']]
        self.assertIn(self.other.id, ids)
