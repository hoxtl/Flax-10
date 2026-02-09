from django.test import TestCase
from studyFlax.models import Tag, Category, RecurrenceRule

class ModelStringTests(TestCase):
    """Tests for model string representations."""
    
    def test_tag_str(self):
        """Test tag string representation."""
        tag = Tag(name="Study")
        self.assertEqual(str(tag), "Study")
        
    def test_category_str(self):
        """Test category string representation."""
        category = Category(name="Work")
        self.assertEqual(str(category), "Work")
        
    def test_recurrence_rule_str(self):
        """Test recurrence rule string representation."""
        rule = RecurrenceRule(frequency="daily", interval=2)
        self.assertEqual(str(rule), "daily every 2")
