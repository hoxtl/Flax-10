import json
from rest_framework import status
from ..base import BaseTestCase
from studyFlax.models import Tag

class TagDetailTests(BaseTestCase):
    """Tests for tag detail operations (GET, PATCH, DELETE)."""

    def setUp(self):
        """Set up tag detail test environment."""
        super().setUp()
        self.tag = Tag.objects.create(name="test_tag", color="#000000", is_default=False, user=self.user)
        self.url = f"/api/tags/{self.tag.id}/"
        self.detail_url = lambda pk: f"/api/tags/{pk}/"

    def test_get_tag_detail(self):
        """Test retrieving a specific tag."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.tag.name)

    def test_get_tag_not_found(self):
        """Test retrieving a non-existent tag."""
        response = self.client.get(self.detail_url(9999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_tag(self):
        """Test updating a tag."""
        data = {"name": "updated_tag"}
        response = self.client.patch(self.url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tag.refresh_from_db()
        self.assertEqual(self.tag.name, "updated_tag")

    def test_update_tag_invalid(self):
        """Test updating a tag with invalid data."""
        data = {"color": "invalid_color"} 
        response = self.client.patch(self.url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_tag(self):
        """Test deleting a tag."""
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Tag.objects.filter(id=self.tag.id).exists())

    def test_delete_other_tag_forbidden(self):
        """Test that deleting the 'other' tag is forbidden."""
        other_tag = Tag.objects.get(name="other")
        url = self.detail_url(other_tag.id)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class TagListTests(BaseTestCase):
    """Tests for listing and creating tags."""

    def setUp(self):
        """Set up tag list test environment."""
        super().setUp()
        self.url = "/api/tags/"

    def test_list_tags(self):
        """Test listing tags."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)

    def test_create_tag(self):
        """Test creating a tag."""
        data = {"name": "new_tag", "color": "#123456"}
        response = self.client.post(self.url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Tag.objects.filter(name="new_tag").count(), 1)

    def test_create_tag_invalid(self):
        """Test creating an invalid tag."""
        data = {"color": "red"} 
        response = self.client.post(self.url, json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
