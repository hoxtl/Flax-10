"""
Tests for authentication and registration serialiser logic.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from studyFlax.models.auth.user_settings_model import UserSettings
from studyFlax.models.society.society_model import Society
from studyFlax.models.tasks.task_model import Task


User = get_user_model()


class ResetPasswordSerializerTest(TestCase):
    """Tests reset password serialiser."""

    def test_normalise_email(self):
        from studyFlax.serialisers.auth.reset_password_serialisers import ResetPasswordSerialiser
        serializer = ResetPasswordSerialiser()
        self.assertEqual(serializer.normalise_lowercase_email('  TEST@Example.COM  '), 'test@example.com')

    def test_confirm_passwords_match(self):
        from studyFlax.serialisers.auth.reset_password_serialisers import ResetPasswordConfirmSerialiser
        serializer = ResetPasswordConfirmSerialiser()
        data = {'new_password': 'abc12345', 'confirm_password': 'abc12345', 'token': 'tok'}
        self.assertEqual(serializer.validate_passwords(data), data)

    def test_confirm_passwords_mismatch(self):
        from rest_framework.exceptions import ValidationError
        from studyFlax.serialisers.auth.reset_password_serialisers import ResetPasswordConfirmSerialiser
        serializer = ResetPasswordConfirmSerialiser()
        data = {'new_password': 'abc12345', 'confirm_password': 'different', 'token': 'tok'}
        with self.assertRaises(ValidationError):
            serializer.validate_passwords(data)


class RegistrationSerializerEmailTest(TestCase):
    """Tests registration serialiser email."""

    def setUp(self):
        User.objects.create_user(
            username='existing', email='existing@test.com', password='pass',
            first_name='Ex', last_name='User',
        )

    def test_duplicate_email_rejected(self):
        from studyFlax.serialisers.auth.auth_serialisers import RegistrationUserSerialiser
        data = {
            'username': 'newuser', 'email': 'existing@test.com',
            'password': 'password123', 'password2': 'password123',
            'first_name': 'New', 'last_name': 'User',
        }
        serializer = RegistrationUserSerialiser(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)


class AuthAndTaskCoverageTest(TestCase):
    """Tests auth and task coverage."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(username='auth_cov', email='auth_cov@example.com', password='pass')

    def test_user_serializer_without_request_returns_false_and_none_values(self):
        from studyFlax.serialisers.auth.auth_serialisers import UserSerialiser
        serializer = UserSerialiser(self.user)
        self.assertFalse(serializer.data['is_shared_with_me'])
        self.assertFalse(serializer.data['is_sharing'])
        self.assertIsNone(serializer.data['study_hours_this_week'])
        self.assertIsNone(serializer.data['study_streak'])

    def test_user_serializer_with_settings_modules(self):
        from studyFlax.serialisers.auth.auth_serialisers import UserSerialiser
        UserSettings.objects.create(user=self.user, modules=['CS200'])
        request = self.factory.get('/')
        request.user = self.user
        serializer = UserSerialiser(self.user, context={'request': request})
        self.assertEqual(serializer.data['modules'], ['CS200'])

    def test_get_user_tasks_list_filter_helper(self):
        from studyFlax.views.tasks.task_view_service import get_user_tasks
        task_list = self.user.task_lists.create(name='Personal', category='personal')
        Task.objects.create(user=self.user, title='Listed', task_list=task_list)
        Task.objects.create(user=self.user, title='Other')
        tasks = get_user_tasks(self.user, {'list': str(task_list.id)})
        self.assertEqual(tasks.count(), 1)


class SerializerCoverageTest(TestCase):
    """Tests serialiser coverage."""

    def setUp(self):
        self.user = User.objects.create_user(username='ser_user', email='ser_user@test.com', password='pass')

    def test_registration_serializer_duplicate_username(self):
        from studyFlax.serialisers.auth.auth_serialisers import RegistrationUserSerialiser
        data = {
            'username': 'ser_user', 'email': 'new@test.com',
            'password': 'password1', 'password2': 'password1',
            'first_name': 'Test', 'last_name': 'User',
        }
        serializer = RegistrationUserSerialiser(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_user_serializer_is_sharing_self(self):
        from studyFlax.serialisers.auth.auth_serialisers import UserSerialiser
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = self.user
        serializer = UserSerialiser(self.user, context={'request': request})
        self.assertTrue(serializer.data['is_sharing'])

    def test_user_serializer_teacher_name_prefixed_with_dr(self):
        from studyFlax.serialisers.auth.auth_serialisers import UserSerialiser
        teacher = User.objects.create_user(
            username='teach_name', email='teach_name@test.com', password='pass',
            first_name='Alex', last_name='Stone', role='teacher',
        )
        serializer = UserSerialiser(teacher)
        self.assertEqual(serializer.data['name'], 'Dr. Alex Stone')

    def test_deadline_serializer_non_teacher_validation(self):
        from studyFlax.serialisers.calendar.deadline_serialisers import DeadlineSerialiser
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = self.user
        data = {'title': 'Test', 'deadline_type': 'coursework', 'start_due_date': timezone.now().isoformat()}
        serializer = DeadlineSerialiser(data=data, context={'request': request})
        self.assertFalse(serializer.is_valid())

    def test_user_settings_serializer_valid_major_update(self):
        from studyFlax.serialisers.user.user_settings_serialisers import UserSettingsSerialiser
        settings = UserSettings.objects.create(user=self.user, theme='light', timezone='Europe/London')
        serializer = UserSettingsSerialiser(settings, data={'major': 'Physics'}, partial=True)
        self.assertTrue(serializer.is_valid())

    def test_registration_serializer_passwords_mismatch(self):
        from studyFlax.serialisers.auth.auth_serialisers import RegistrationUserSerialiser
        data = {
            'username': 'mismatch_user', 'email': 'mismatch@test.com',
            'password': 'password1', 'password2': 'password2',
            'first_name': 'Test', 'last_name': 'User',
        }
        serializer = RegistrationUserSerialiser(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_society_event_serialiser_announcement_prefix(self):
        from studyFlax.serialisers.society.society_serialisers import SocietyEventSerialiser
        from studyFlax.models.society.society_announcement_model import SocietyAnnouncement
        from studyFlax.models.society.society_event_model import SocietyEvent
        society = Society.objects.create(name='PrefixSoc', bio='bio', admin_emails='a@b.com')
        ann = SocietyAnnouncement.objects.create(society=society, title='Announcement', content='Body')
        event = SocietyEvent.objects.create(
            society=society, title='Launch',
            start_time=timezone.now(), end_time=timezone.now() + timedelta(hours=1),
            recurrence='none', announcement=ann,
        )
        serializer = SocietyEventSerialiser(event)
        self.assertIn('📢', serializer.data['title'])


class ResetPasswordSerialiserCoverageTest(TestCase):
    """Tests reset password serialiser coverage."""

    def test_validate_email_normalises(self):
        from studyFlax.serialisers.auth.reset_password_serialisers import ResetPasswordSerialiser
        s = ResetPasswordSerialiser(data={'email': 'Test@Example.COM'})
        self.assertTrue(s.is_valid())

    def test_confirm_short_password_rejected(self):
        from studyFlax.serialisers.auth.reset_password_serialisers import ResetPasswordConfirmSerialiser
        s = ResetPasswordConfirmSerialiser(data={
            'token': 'abc123',
            'new_password': 'short',
            'confirm_password': 'short',
        })
        self.assertFalse(s.is_valid())


class CommonSerialiserUtilsTest(TestCase):
    """Tests common serialiser utils."""

    def test_is_user_sharing_with_allow_self_returns_true(self):
        from studyFlax.serialisers.common import is_user_sharing_with
        user = User.objects.create_user(username='self_share', email='self_share@test.com', password='pass')
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = user
        self.assertTrue(is_user_sharing_with(user, request, allow_self=True))


class FormatTeacherNameTest(TestCase):
    """Tests format teacher name."""

    def test_returns_unknown_for_none_user(self):
        from studyFlax.serialisers.common import format_teacher_name
        self.assertEqual(format_teacher_name(None), 'Unknown')


class RegistrationSerialiserFieldTest(TestCase):
    """Tests registration serialiser field."""

    def test_get_first_name_from_valid_registration(self):
        from studyFlax.serialisers.auth.auth_serialisers import RegistrationUserSerialiser
        data = {
            'username': 'fieldtest', 'email': 'fieldtest@test.com',
            'password': 'password1', 'password2': 'password1',
            'first_name': 'Jane', 'last_name': 'Doe',
        }
        s = RegistrationUserSerialiser(data=data)
        self.assertTrue(s.is_valid())
        self.assertEqual(s.validated_data['first_name'], 'Jane')
        self.assertEqual(s.validated_data['last_name'], 'Doe')
        self.assertEqual(s.validated_data['email'], 'fieldtest@test.com')
