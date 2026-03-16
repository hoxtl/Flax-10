"""
Backend tests for hello.
"""

import json
from django.test import TestCase
from django.test.client import RequestFactory

from studyFlax.views.hello import hello

class HelloViewTest(TestCase):
    """Tests for hello view."""
    def setUp(self):
        self.factory = RequestFactory()

    def test_hello_view(self):
        request = self.factory.get('/hello/')
        response = hello(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {"message": "Hello from Django REST Framework"}
        )
