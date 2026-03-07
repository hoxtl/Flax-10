from django.test import TestCase
from django.core.management import call_command
from django.contrib.auth import get_user_model
from io import StringIO
from unittest.mock import patch
from studyFlax.models import (
    Category, Tag, RecurrenceRule, CalendarEvent,
    UserSettings, Module, Enrollment
)
from studyFlax.models.timer.sessionModel import StudySession
from studyFlax.models.timer.themeSessionModel import ThemeSession
from studyFlax.models.society.societyModel import Society

User = get_user_model()


class SeedCommandTest(TestCase):
    def test_seed_creates_users(self):
        out = StringIO()
        call_command('seed', stdout=out)
        self.assertGreater(User.objects.count(), 0)

    def test_seed_creates_categories(self):
        out = StringIO()
        call_command('seed', stdout=out)
        self.assertGreater(Category.objects.count(), 0)

    def test_seed_creates_tags(self):
        out = StringIO()
        call_command('seed', stdout=out)
        self.assertGreater(Tag.objects.count(), 0)

    def test_seed_creates_modules(self):
        out = StringIO()
        call_command('seed', stdout=out)
        self.assertGreater(Module.objects.count(), 0)

    def test_seed_creates_events(self):
        out = StringIO()
        call_command('seed', stdout=out)
        self.assertGreater(CalendarEvent.objects.count(), 0)

    def test_seed_creates_study_sessions(self):
        out = StringIO()
        call_command('seed', stdout=out)
        self.assertGreater(StudySession.objects.count(), 0)

    def test_seed_creates_societies(self):
        out = StringIO()
        call_command('seed', stdout=out)
        self.assertGreater(Society.objects.count(), 0)

    def test_seed_creates_enrollments(self):
        out = StringIO()
        call_command('seed', stdout=out)
        self.assertGreater(Enrollment.objects.count(), 0)

    def test_seed_creates_recurrence_rules(self):
        out = StringIO()
        call_command('seed', stdout=out)
        self.assertGreater(RecurrenceRule.objects.count(), 0)

    def test_seed_idempotent(self):
        out = StringIO()
        call_command('seed', stdout=out)
        count_after_first = User.objects.count()
        call_command('seed', stdout=out)
        self.assertEqual(User.objects.count(), count_after_first)

    def test_seed_creates_theme_sessions(self):
        out = StringIO()
        call_command('seed', stdout=out)
        self.assertGreater(ThemeSession.objects.count(), 0)

    def test_seed_creates_user_settings(self):
        out = StringIO()
        call_command('seed', stdout=out)
        self.assertGreater(UserSettings.objects.count(), 0)


class UnseedCommandTest(TestCase):
    def test_unseed_clears_data(self):
        seed_out = StringIO()
        call_command('seed', stdout=seed_out)
        self.assertGreater(User.objects.filter(is_superuser=False).count(), 0)
        out = StringIO()
        with patch('builtins.input', return_value='yes'):
            call_command('unseed', stdout=out)
        self.assertEqual(User.objects.filter(is_superuser=False).count(), 0)

    def test_unseed_preserves_superusers(self):
        User.objects.create_superuser(username='admin', email='admin@test.com', password='pass')
        out = StringIO()
        with patch('builtins.input', return_value='yes'):
            call_command('unseed', stdout=out)
        self.assertTrue(User.objects.filter(is_superuser=True).exists())

    def test_unseed_cancelled(self):
        seed_out = StringIO()
        call_command('seed', stdout=seed_out)
        count_before = User.objects.count()
        out = StringIO()
        with patch('builtins.input', return_value='no'):
            call_command('unseed', stdout=out)
        self.assertEqual(User.objects.count(), count_before)
