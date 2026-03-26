"""
Backend tests for system tags.
"""

from django.test import TestCase
from studyFlax.models import Tag, CalendarEvent
from django.utils import timezone
from datetime import timedelta
from studyFlax.tests.helpers.test_model_builders import make_user


class GetSystemTagTest(TestCase):
    """Tests for get_system_tag and related helpers."""

    def test_get_system_tag_unknown_name_returns_none(self):
        from studyFlax.views.calendar.system_tags import get_system_tag
        result = get_system_tag('NonExistent')
        self.assertIsNone(result)

    def test_get_system_tag_creates_lecture_tag(self):
        from studyFlax.views.calendar.system_tags import get_system_tag
        result = get_system_tag('Lecture')
        self.assertIsNotNone(result)
        self.assertEqual(result.name, 'Lecture')
        self.assertTrue(result.is_default)
        self.assertIsNone(result.user)

    def test_get_system_tag_creates_deadline_tag(self):
        from studyFlax.views.calendar.system_tags import get_system_tag
        result = get_system_tag('Deadline')
        self.assertIsNotNone(result)
        self.assertEqual(result.name, 'Deadline')

    def test_get_system_tag_creates_exam_tag(self):
        from studyFlax.views.calendar.system_tags import get_system_tag
        result = get_system_tag('Exam')
        self.assertIsNotNone(result)
        self.assertEqual(result.name, 'Exam')

    def test_get_system_tag_creates_societies_tag(self):
        from studyFlax.views.calendar.system_tags import get_system_tag
        result = get_system_tag('Societies')
        self.assertIsNotNone(result)
        self.assertEqual(result.name, 'Societies')

    def test_get_system_tag_returns_existing(self):
        from studyFlax.views.calendar.system_tags import get_system_tag
        tag1 = get_system_tag('Lecture')
        tag2 = get_system_tag('Lecture')
        self.assertEqual(tag1.id, tag2.id)
        self.assertEqual(Tag.objects.filter(name='Lecture', is_default=True).count(), 1)

    def test_get_system_tag_updates_stale_tag(self):
        from studyFlax.views.calendar.system_tags import get_system_tag
        tag = Tag.objects.create(name='Lecture', is_default=True, user=None,
                                 color='#000000', default_duration=60, icon='🔧')
        result = get_system_tag('Lecture')
        result.refresh_from_db()
        self.assertEqual(result.icon, '📚')

    def test_get_system_tag_fixes_user_owned_tag(self):
        from studyFlax.views.calendar.system_tags import get_system_tag
        user = make_user()
        tag = Tag.objects.create(name='Lecture', is_default=False, user=user,
                                 color='#000', default_duration=60, icon='📚')
        result = get_system_tag('Lecture')
        result.refresh_from_db()
        self.assertTrue(result.is_default)
        self.assertIsNone(result.user)

class CreateSystemTagTest(TestCase):
    """Tests for create_system_tag."""

    def test_create_system_tag(self):
        from studyFlax.views.calendar.system_tags import create_system_tag
        config = {'color': '#FF0000', 'duration': 90, 'icon': '🏋️'}
        tag = create_system_tag('Fitness', config)
        self.assertEqual(tag.name, 'Fitness')
        self.assertTrue(tag.is_default)
        self.assertIsNone(tag.user)
        self.assertEqual(tag.color, '#FF0000')
        self.assertEqual(tag.default_duration, 90)

class MergeTagsTest(TestCase):
    """Tests for merge_duplicate_tags and consolidate_tags."""

    def setUp(self):
        self.user = make_user()

    def test_merge_duplicate_tags(self):
        from studyFlax.views.calendar.system_tags import merge_duplicate_tags
        primary = Tag.objects.create(name='TestTag', is_default=False, color='#f00', default_duration=60)
        dup = Tag.objects.create(name='TestTag', is_default=False, color='#f00', default_duration=60)
        event = CalendarEvent.objects.create(
            user=self.user, tag=dup, title='Ev',
            start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1)
        )
        merge_duplicate_tags(primary, [dup])
        event.refresh_from_db()
        self.assertEqual(event.tag, primary)
        self.assertFalse(Tag.objects.filter(id=dup.id).exists())

    def test_consolidate_tags(self):
        from studyFlax.views.calendar.system_tags import consolidate_tags
        tag1 = Tag.objects.create(name='Lecture', is_default=False, color='#f00', default_duration=60)
        tag2 = Tag.objects.create(name='Lecture', is_default=False, color='#0f0', default_duration=60)
        config = {'color': '#4A90D9', 'duration': 120, 'icon': '📚'}
        result = consolidate_tags([tag1, tag2], config)
        self.assertEqual(result.id, tag1.id)
        self.assertFalse(Tag.objects.filter(id=tag2.id).exists())
        tag1.refresh_from_db()
        self.assertTrue(tag1.is_default)

class UpdateTagFieldsTest(TestCase):
    """Tests for update_tag_fields."""

    def test_update_tag_fields_not_default(self):
        from studyFlax.views.calendar.system_tags import update_tag_fields
        tag = Tag(name='X', is_default=False, user=None, icon='🏷️')
        config = {'icon': '📚'}
        changed = update_tag_fields(tag, config)
        self.assertTrue(changed)
        self.assertTrue(tag.is_default)

    def test_update_tag_fields_has_user(self):
        from studyFlax.views.calendar.system_tags import update_tag_fields
        user = make_user()
        tag = Tag(name='X', is_default=True, user=user, icon='🏷️')
        config = {'icon': '🏷️'}
        changed = update_tag_fields(tag, config)
        self.assertTrue(changed)
        self.assertIsNone(tag.user)

    def test_update_tag_fields_wrong_icon(self):
        from studyFlax.views.calendar.system_tags import update_tag_fields
        tag = Tag(name='X', is_default=True, user=None, icon='🔧')
        config = {'icon': '📚'}
        changed = update_tag_fields(tag, config)
        self.assertTrue(changed)
        self.assertEqual(tag.icon, '📚')

    def test_update_tag_fields_no_changes(self):
        from studyFlax.views.calendar.system_tags import update_tag_fields
        tag = Tag(name='X', is_default=True, user=None, icon='🏷️')
        config = {}
        changed = update_tag_fields(tag, config)
        self.assertFalse(changed)

class ShortcutFunctionsTest(TestCase):
    """Tests for get_lecture_tag, get_deadline_tag, etc."""

    def test_get_lecture_tag(self):
        from studyFlax.views.calendar.system_tags import get_lecture_tag
        tag = get_lecture_tag()
        self.assertEqual(tag.name, 'Lecture')

    def test_get_deadline_tag(self):
        from studyFlax.views.calendar.system_tags import get_deadline_tag
        tag = get_deadline_tag()
        self.assertEqual(tag.name, 'Deadline')

    def test_get_exam_tag(self):
        from studyFlax.views.calendar.system_tags import get_exam_tag
        tag = get_exam_tag()
        self.assertEqual(tag.name, 'Exam')

    def test_get_societies_tag(self):
        from studyFlax.views.calendar.system_tags import get_societies_tag
        tag = get_societies_tag()
        self.assertEqual(tag.name, 'Societies')

class FixUntaggedEventsTest(TestCase):
    """Tests for fix_untagged_deadline_events, fix_deadline_events, fix_exam_events."""

    def setUp(self):
        self.user = make_user()

    def _create_event(self, title, tag=None):
        return CalendarEvent.objects.create(
            user=self.user, source='module_deadline',
            title=title, tag=tag,
            start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1)
        )

    def test_fix_deadline_events(self):
        from studyFlax.views.calendar.system_tags import fix_deadline_events, get_deadline_tag
        deadline_tag = get_deadline_tag()
        event = self._create_event('Assignment 1')
        fix_deadline_events(deadline_tag)
        event.refresh_from_db()
        self.assertEqual(event.tag, deadline_tag)

    def test_fix_deadline_events_skips_exam(self):
        from studyFlax.views.calendar.system_tags import fix_deadline_events, get_deadline_tag
        deadline_tag = get_deadline_tag()
        exam_event = self._create_event('Exam: Maths')
        fix_deadline_events(deadline_tag)
        exam_event.refresh_from_db()
        self.assertIsNone(exam_event.tag)

    def test_fix_exam_events(self):
        from studyFlax.views.calendar.system_tags import fix_exam_events, get_exam_tag
        exam_tag = get_exam_tag()
        event = self._create_event('Exam: Physics')
        fix_exam_events(exam_tag)
        event.refresh_from_db()
        self.assertEqual(event.tag, exam_tag)

    def test_fix_untagged_deadline_events(self):
        from studyFlax.views.calendar.system_tags import fix_untagged_deadline_events
        deadline_event = self._create_event('Lab Report')
        exam_event = self._create_event('Exam: Chemistry')
        fix_untagged_deadline_events()
        deadline_event.refresh_from_db()
        exam_event.refresh_from_db()
        self.assertIsNotNone(deadline_event.tag)
        self.assertIsNotNone(exam_event.tag)
        self.assertNotEqual(deadline_event.tag, exam_event.tag)

    def test_fix_events_skips_already_tagged(self):
        from studyFlax.views.calendar.system_tags import fix_deadline_events, get_deadline_tag
        deadline_tag = get_deadline_tag()
        other_tag = Tag.objects.create(name='Other', is_default=False, color='#abc', default_duration=30)
        event = self._create_event('Assignment 2', tag=other_tag)
        fix_deadline_events(deadline_tag)
        event.refresh_from_db()
        self.assertEqual(event.tag, other_tag)
