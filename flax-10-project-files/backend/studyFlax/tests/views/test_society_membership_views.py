"""
Tests for society membership view error branches.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from studyFlax.models.society.societyModel import Society
from studyFlax.models.society.societyMembershipModel import SocietyMembership

User = get_user_model()

class MembershipViewCoverageTest(TestCase):
    """Tests for membership view error branches."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='mem_admin', email='mem_admin@test.com', password='pass'
        )
        self.other = User.objects.create_user(
            username='mem_other', email='mem_other@test.com', password='pass'
        )
        self.society = Society.objects.create(
            name='MemSociety', bio='bio', admin_emails='admin@test.com'
        )
        SocietyMembership.objects.create(user=self.admin, society=self.society, role='admin')
        self.client.force_authenticate(user=self.admin)

    def test_join_already_member(self):
        response = self.client.post(f'/api/societies/{self.society.id}/members/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_collaborator_already_member(self):
        SocietyMembership.objects.create(user=self.other, society=self.society, role='member')
        response = self.client.post(
            f'/api/societies/{self.society.id}/members/',
            {'email': self.other.email},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_collaborator_user_not_found(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/members/',
            {'email': 'nonexistent@nowhere.com'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_membership_detail_society_not_found(self):
        response = self.client.delete('/api/societies/99999/members/me/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_remove_other_member_non_admin_denied(self):
        SocietyMembership.objects.create(user=self.other, society=self.society, role='member')
        third = User.objects.create_user(
            username='mem_third', email='mem_third@test.com', password='pass'
        )
        SocietyMembership.objects.create(user=third, society=self.society, role='member')
        self.client.force_authenticate(user=third)
        response = self.client.delete(f'/api/societies/{self.society.id}/members/{self.other.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_leave_membership_not_found(self):
        response = self.client.delete(f'/api/societies/{self.society.id}/members/{self.other.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_role_not_admin(self):
        SocietyMembership.objects.create(user=self.other, society=self.society, role='member')
        self.client.force_authenticate(user=self.other)
        response = self.client.patch(
            f'/api/societies/{self.society.id}/members/{self.other.id}/',
            {'role': 'editor'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_role_member_not_found(self):
        response = self.client.patch(
            f'/api/societies/{self.society.id}/members/99999/',
            {'role': 'editor'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_role_invalid_data(self):
        SocietyMembership.objects.create(user=self.other, society=self.society, role='member')
        response = self.client.patch(
            f'/api/societies/{self.society.id}/members/{self.other.id}/',
            {'role': 'superking'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
