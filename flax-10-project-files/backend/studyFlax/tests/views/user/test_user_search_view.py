"""
Backend tests for user search endpoint.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.modules.enrollment_model import Enrollment
from studyFlax.models.modules.module_model import Module
from studyFlax.models.society.society_membership_model import SocietyMembership
from studyFlax.models.society.society_model import Society
from studyFlax.models.auth.user_settings_model import UserSettings

User = get_user_model()


class UserSearchViewTest(TestCase):
    """Tests for /api/users/search/."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='searcher', email='searcher@example.com', password='pass')
        self.other = User.objects.create_user(
            username='findme', email='findme@example.com', password='pass',
            first_name='John', last_name='Doe'
        )
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
        module = Module.objects.create(
            module_code='CS101',
            module_name='Intro CS',
            created_by=self.user,
            start_time=timezone.now(),
            end_time=timezone.now(),
        )
        Enrollment.objects.create(student=self.other, module=module)
        response = self.client.get('/api/users/search/?module=CS101')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_by_course(self):
        UserSettings.objects.create(
            user=self.other, theme='light', timezone='Europe/London',
            major='Computer Science'
        )
        response = self.client.get('/api/users/search/?course=Computer%20Science')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_search_by_year(self):
        UserSettings.objects.create(
            user=self.other, theme='light', timezone='Europe/London',
            year='Year 2'
        )
        response = self.client.get('/api/users/search/?year=Year%202')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class UserSearchCoverageTest(TestCase):
    """Tests for society filtering in search."""

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
