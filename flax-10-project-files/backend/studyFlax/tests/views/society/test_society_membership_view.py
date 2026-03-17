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

    def test_add_collaborator_success(self):
        response = self.client.post(
            f'/api/societies/{self.society.id}/members/',
            {'email': self.other.email, 'role': 'editor'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_add_teacher_collaborator_denied(self):
        teacher = User.objects.create_user(
            username='teacher_mem', email='teacher_mem@test.com', password='pass'
        )
        teacher.role = 'teacher'
        teacher.save(update_fields=['role'])
        response = self.client.post(
            f'/api/societies/{self.society.id}/members/',
            {'email': teacher.email},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_membership_detail_society_not_found(self):
        response = self.client.delete('/api/societies/99999/members/me/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_members_list(self):
        response = self.client.get(f'/api/societies/{self.society.id}/members/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_membership_list_not_found(self):
        response = self.client.get('/api/societies/99999/members/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_join_society_success(self):
        student = User.objects.create_user(
            username='joiner', email='joiner@example.com', password='pass'
        )
        self.client.force_authenticate(user=student)
        response = self.client.post(f'/api/societies/{self.society.id}/members/')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_join_society_teacher_rejected(self):
        teacher = User.objects.create_user(
            username='join_teacher', email='join_teacher@example.com', password='pass'
        )
        teacher.role = 'teacher'
        teacher.save(update_fields=['role'])
        self.client.force_authenticate(user=teacher)
        response = self.client.post(f'/api/societies/{self.society.id}/members/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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

    def test_add_collaborator_non_admin_denied(self):
        non_admin = User.objects.create_user(
            username='mem_nonadmin', email='mem_nonadmin@test.com', password='pass'
        )
        SocietyMembership.objects.create(user=non_admin, society=self.society, role='member')
        self.client.force_authenticate(user=non_admin)
        response = self.client.post(
            f'/api/societies/{self.society.id}/members/',
            {'username': self.other.username},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_find_user_by_identifier_without_identifier(self):
        from studyFlax.views.society.membership_view import find_user_by_identifier

        self.assertIsNone(find_user_by_identifier({}))

    def test_update_role_invalid_data_as_admin(self):
        member = User.objects.create_user(
            username='admin_target', email='admin_target@example.com', password='pass'
        )
        SocietyMembership.objects.create(user=member, society=self.society, role='member')
        response = self.client.patch(
            f'/api/societies/{self.society.id}/members/{member.id}/',
            {'role': 'superking'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_role_success(self):
        member = User.objects.create_user(
            username='member_target', email='member_target@test.com', password='pass'
        )
        SocietyMembership.objects.create(user=member, society=self.society, role='member')
        response = self.client.patch(
            f'/api/societies/{self.society.id}/members/{member.id}/',
            {'role': 'admin'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'admin')

    def test_get_membership_by_user_id_none(self):
        from studyFlax.views.society.membership_view import get_membership_by_user_id

        self.assertIsNone(get_membership_by_user_id(self.society, 999999))
