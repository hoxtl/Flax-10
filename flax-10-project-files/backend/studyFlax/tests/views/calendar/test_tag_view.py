"""
Backend tests for tag views.
"""

import json
from rest_framework import status
from ...helpers.test_case_support import BaseTestCase
from studyFlax.models import Tag


class TagDetailTests(BaseTestCase):
    """Tests for tag detail operations (GET, PATCH, DELETE)."""

    def setUp(self):
        """Set up the test case."""
        super().setUp()
        self.tag = Tag.objects.create(name="test_tag", color="#000000", is_default=False, user=self.user)
        self.url = f"/api/tags/{self.tag.id}/"
        self.detail_url = lambda pk: f"/api/tags/{pk}/"

    def test_get_tag_detail(self):
        """Test get tag detail."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.tag.name)

    def test_get_tag_not_found(self):
        """Test get tag not found."""
        response = self.client.get(self.detail_url(9999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_tag(self):
        """Test update tag."""
        data = {"name": "updated_tag"}
        response = self.client.patch(self.url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tag.refresh_from_db()
        self.assertEqual(self.tag.name, "updated_tag")

    def test_update_tag_invalid(self):
        """Test update tag invalid."""
        data = {"color": "invalid_color"} 
        response = self.client.patch(self.url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_delete_default_tag(self):
        """Test cannot delete default tag."""
        tag = Tag.objects.create(name='Lecture', is_default=True, user=None, color='#abc', default_duration=30)

        response = self.client.delete(self.detail_url(tag.id))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot delete', response.data['error'])

    def test_cannot_rename_protected_tag(self):
        """Test cannot rename protected tag."""
        tag = Tag.objects.create(name='Lecture', is_default=True, user=None, color='#abc', default_duration=30)

        response = self.client.patch(
            self.detail_url(tag.id),
            json.dumps({'name': 'HackedLecture'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot rename', response.data['error'])

    def test_can_update_icon_on_restricted_default_tag(self):
        """Test can update icon on restricted default tag."""
        tag = Tag.objects.create(
            name='CustomDefault',
            is_default=True,
            user=None,
            color='#abc',
            default_duration=30,
            icon='tag',
        )

        response = self.client.patch(
            self.detail_url(tag.id),
            json.dumps({'icon': 'star'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['icon'], 'star')

    def test_only_icon_allowed_on_restricted_default_tag(self):
        """Test only icon allowed on restricted default tag."""
        tag = Tag.objects.create(name='CustomDefault2', is_default=True, user=None, color='#abc', default_duration=30)

        response = self.client.patch(
            self.detail_url(tag.id),
            json.dumps({'color': '#fff'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('icon', response.data['error'])

    def test_delete_tag(self):
        """Test delete tag."""
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Tag.objects.filter(id=self.tag.id).exists())

    def test_delete_other_tag_forbidden(self):
        """Test delete other tag forbidden."""
        other_tag = Tag.objects.get(name="other")
        url = self.detail_url(other_tag.id)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class TagListTests(BaseTestCase):
    """Tests for listing and creating tags."""

    def setUp(self):
        """Set up the test case."""
        super().setUp()
        self.url = "/api/tags/"

    def test_list_tags(self):
        """Test list tags."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)

    def test_create_tag(self):
        """Test create tag."""
        data = {"name": "new_tag", "color": "#123456"}
        response = self.client.post(self.url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Tag.objects.filter(name="new_tag").count(), 1)

    def test_create_tag_invalid(self):
        """Test create tag invalid."""
        data = {"color": "red"} 
        response = self.client.post(self.url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_tag_list_with_enrollment_shows_system_tags(self):
        """Test tag list with enrollment shows system tags."""
        from django.utils import timezone
        from studyFlax.models.modules.enrollment_model import Enrollment
        from studyFlax.models.modules.module_model import Module

        Module.objects.create(
            module_code='ZZZ999',
            module_name='Test Module',
            created_by=self.user,
            start_time=timezone.now(),
            end_time=timezone.now(),
        )
        module = Module.objects.get(module_code='ZZZ999')
        Enrollment.objects.create(student=self.user, module=module)
        Tag.objects.create(name='Lecture', is_default=True, user=None, color='#000', default_duration=60)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_tag_list_without_enrollment_excludes_system_tags(self):
        """Test tag list without enrollment excludes system tags."""
        Tag.objects.create(name='Lecture', is_default=True, user=None, color='#000', default_duration=60)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('Lecture', [tag['name'] for tag in response.data])

    def test_category_list(self):
        """Test category list."""
        response = self.client.get("/api/categories/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_tag_list_with_society_sync_shows_societies_tag(self):
        """Test tag list with society sync shows societies tag."""
        from studyFlax.models.society.society_model import Society
        from studyFlax.models.society.society_membership_model import SocietyMembership
        from studyFlax.models.society.society_calendar_sync_model import SocietyCalendarSync
        from studyFlax.views.calendar.system_tags import get_societies_tag
        society = Society.objects.create(name='TagSyncSoc', bio='bio', admin_emails='a@b.com')
        SocietyMembership.objects.create(user=self.user, society=society, role='member')
        SocietyCalendarSync.objects.create(user=self.user, society=society)
        get_societies_tag()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
