from rest_framework import status
from .base import BaseTestCase
from .fixtures import create_tag_data
from studyFlax.models import Category

class CoverageGapTests(BaseTestCase):
    """Test suite to cover remaining logic gaps."""

    def test_fixtures_create_tag_data(self):
        """Test create_tag_data helper."""
        data = create_tag_data(name="coverage")
        self.assertEqual(data["name"], "coverage")
        self.assertEqual(data["color"], "#34D399")

    def test_category_list_view(self):
        """Test category list endpoint."""
        Category.objects.create(name="Cat1", color="#111")
        url = "/api/categories/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
        self.assertEqual(response.data[0]['name'], "Cat1")
