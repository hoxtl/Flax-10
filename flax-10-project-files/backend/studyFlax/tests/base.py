from django.test import TestCase
from studyFlax.models import Tag, CalendarEvent, RecurrenceRule
from .fixtures import get_sample_tags, SAMPLE_TAGS

class BaseTestCase(TestCase):
    """Base test case with common setup."""
    
    def setUp(self):
        """Set up test environment."""
        from studyFlax.models import User
        self.user = User.objects.create(
            email="test@example.com", 
            password="password",
            first_name="Test",
            last_name="User"
        )
        self.create_sample_tags()
    
    def create_sample_tags(self):
        """Create sample tags in database."""
        for tag_data in get_sample_tags():
            Tag.objects.create(**tag_data, is_default=True)
    
    def get_tag_by_name(self, name):
        """Get tag by name."""
        return Tag.objects.get(name=name)

class BaseEventTestCase(BaseTestCase):
    """Base test case for event tests."""
    
    def setUp(self):
        """Set up event test environment."""
        super().setUp()
        self.url = "/api/events/"
    
    def assert_event_response(self, response, expected_status):
        """Assert response status."""
        self.assertEqual(response.status_code, expected_status)
    
    def assert_event_data(self, event, expected):
        """Assert event data matches expected."""
        self.assertEqual(event["title"], expected["title"])
        if "description" in expected:
            self.assertEqual(event["description"], expected["description"])
    
    def create_event_in_db(self, event_data, user=None):
        """Create event directly in database."""
        if user is None:
            user = self.user
        tag_id = event_data.pop("tag", None)
        recurrence_data = event_data.pop("recurrence_rule", None)
        recurrence_rule = None
        if recurrence_data:
            import json
            if isinstance(recurrence_data, str):
                try:
                    recurrence_data = json.loads(recurrence_data)
                except json.JSONDecodeError:
                    pass
            recurrence_rule = RecurrenceRule.objects.create(**recurrence_data)
        
        # Parse datetime strings to objects if needed
        from datetime import datetime
        if isinstance(event_data.get('start_time'), str):
            event_data['start_time'] = datetime.fromisoformat(event_data['start_time'].replace('Z', '+00:00'))
        if isinstance(event_data.get('end_time'), str):
             event_data['end_time'] = datetime.fromisoformat(event_data['end_time'].replace('Z', '+00:00'))

        event = CalendarEvent.objects.create(recurrence_rule=recurrence_rule, user=user, **event_data)
        if tag_id:
            event.tag_id = tag_id
            event.save()
        return event


