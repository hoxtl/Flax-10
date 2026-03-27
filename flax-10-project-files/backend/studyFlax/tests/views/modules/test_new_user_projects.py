"""
Tests starter project seeding for new users.
"""

from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from studyFlax.models.groupwork.groupwork_model import GroupMembership, GroupProject
from studyFlax.models.modules.enrollment_model import Enrollment
from studyFlax.models.modules.module_model import Module
from studyFlax.tests.helpers.test_model_builders import make_user


def _make_module(user, code='NP01', name='New Projects Module'):
    return Module.objects.create(
        module_code=code,
        module_name=name,
        created_by=user,
        start_time=timezone.now(),
        end_time=timezone.now() + timedelta(hours=1),
    )


class SeedNewUserProjectsTest(TestCase):
    """Tests seed new user projects."""

    def setUp(self):
        self.user = make_user('np_user', 'np_user@e.com')
        self.now = timezone.now()



    def test_returns_zero_when_no_enrolled_modules(self):
        from studyFlax.views.modules.new_user_projects import seed_new_user_projects
        result = seed_new_user_projects(self.user, now=self.now)
        self.assertEqual(result, 0)

    def test_creates_project_for_enrolled_module(self):
        from studyFlax.views.modules.new_user_projects import seed_new_user_projects
        module = _make_module(self.user)
        Enrollment.objects.create(student=self.user, module=module)
        demo_user = make_user('np_demo', 'np_demo@e.com')
        spec = {'name': 'NP Project', 'module': module, 'source_deadline': None}
        with patch('studyFlax.views.modules.new_user_projects._get_demo_users', return_value=[demo_user]):
            with patch('studyFlax.views.modules.new_user_projects._build_module_project_specs', return_value=[spec]):
                result = seed_new_user_projects(self.user, now=self.now)
        self.assertGreater(result, 0)
        self.assertTrue(GroupProject.objects.filter(name='NP Project').exists())

    def test_create_project_for_spec_uses_source_deadline(self):
        from studyFlax.views.modules.new_user_projects import _create_project_for_spec
        module = _make_module(self.user, code='NP02')
        deadline_date = self.now + timedelta(days=10)
        fake_deadline = SimpleNamespace(start_due_date=deadline_date)
        spec = {'name': 'Deadline Project', 'module': module, 'source_deadline': fake_deadline}
        project, created = _create_project_for_spec(spec, self.user, self.now)
        self.assertTrue(created)
        self.assertEqual(project.deadline, deadline_date)

    def test_create_project_for_spec_generates_deadline_when_no_source(self):
        from studyFlax.views.modules.new_user_projects import _create_project_for_spec
        module = _make_module(self.user, code='NP03')
        spec = {'name': 'Random Deadline Project', 'module': module, 'source_deadline': None}
        project, created = _create_project_for_spec(spec, self.user, self.now)
        self.assertTrue(created)
        self.assertIsNotNone(project.deadline)

    def test_add_demo_members_does_nothing_when_no_candidates(self):
        from studyFlax.views.modules.new_user_projects import _add_demo_members
        module = _make_module(self.user, code='NP07')
        project = GroupProject.objects.create(name='No Candidates Project', owner=self.user, course_code='NP07')
        GroupMembership.objects.create(project=project, user=self.user, role='owner')
        _add_demo_members(project, self.user, [self.user])
        self.assertEqual(GroupMembership.objects.filter(project=project).count(), 1)

    def test_add_demo_members_adds_members_to_project(self):
        from studyFlax.views.modules.new_user_projects import _add_demo_members
        module = _make_module(self.user, code='NP04')
        project = GroupProject.objects.create(name='Demo Project', owner=self.user, course_code='NP04')
        GroupMembership.objects.create(project=project, user=self.user, role='owner')
        demo1 = make_user('np_d1', 'np_d1@e.com')
        demo2 = make_user('np_d2', 'np_d2@e.com')
        demo3 = make_user('np_d3', 'np_d3@e.com')
        _add_demo_members(project, self.user, [demo1, demo2, demo3])
        self.assertGreater(GroupMembership.objects.filter(project=project).count(), 1)

    def test_get_demo_users_returns_list(self):
        from studyFlax.views.modules.new_user_projects import _get_demo_users
        result = _get_demo_users()
        self.assertIsInstance(result, list)

    def test_seed_project_for_module_returns_false_when_no_spec(self):
        from studyFlax.views.modules.new_user_projects import _seed_project_for_module
        module = _make_module(self.user, code='NP08')
        with patch('studyFlax.views.modules.new_user_projects._build_module_project_specs', return_value=[]):
            result = _seed_project_for_module(module, self.user, self.now, [])
        self.assertFalse(result)


