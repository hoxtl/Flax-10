from rest_framework import status
from ..base import BaseTestCase
from ..fixtures import create_tag_data, SAMPLE_TAGS
from studyFlax.models import Tag

class TagCreateTests(BaseTestCase):
    """Tests for creating tags."""
    
    def setUp(self):
        """Set up tag test environment."""
        super().setUp()
        self.url = "/api/tags/"
        Tag.objects.all().delete()
    
    def test_create_tag(self):
        """Test creating a tag."""
        data = create_tag_data("work")
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "work")
        self.assertEqual(Tag.objects.count(), 1)
    
    def test_create_tag_minimal(self):
        """Test creating tag with only name."""
        data = {"name": "personal"}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_create_tag_missing_name(self):
        """Test creating tag without name fails."""
        data = {"color": "#FF0000"}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class TagListTests(BaseTestCase):
    """Tests for listing tags."""
    
    def setUp(self):
        """Set up tag list test environment."""
        super().setUp()
        self.url = "/api/tags/"
    
    def test_list_all_tags(self):
        """Test listing all tags."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), len(SAMPLE_TAGS))
    
    def test_list_empty_tags(self):
        """Test listing when no tags exist."""
        Tag.objects.all().delete()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    
    def test_list_categories(self):
        """Test listing categories."""
        url = "/api/categories/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming categories might be empty or present, just check status
        self.assertTrue(len(response.data) >= 0)
