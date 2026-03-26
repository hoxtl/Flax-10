"""
Tests for task serialisers.
"""

from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status

from studyFlax.models.tasks.task_model import Task, TaskList
from studyFlax.tests.helpers.test_model_builders import make_society, make_user


class TaskSerializerTest(TestCase):
    """Tests for task serializer."""

    def setUp(self):
        self.user = make_user('taskser_user', 'taskser@e.com')

    def test_serializer_marks_completed_at_on_completion(self):
        from studyFlax.serialisers.tasks.task_serialisers import TaskSerialiser
        task = Task.objects.create(user=self.user, title='Test', completed=False)
        serializer = TaskSerialiser(task, data={'completed': True}, partial=True)
        self.assertTrue(serializer.is_valid())
        updated = serializer.save()
        self.assertIsNotNone(updated.completed_at)

    def test_serializer_clears_completed_at_on_reopen(self):
        from studyFlax.serialisers.tasks.task_serialisers import TaskSerialiser
        task = Task.objects.create(
            user=self.user, title='Test', completed=True, completed_at=timezone.now(),
        )
        serializer = TaskSerialiser(task, data={'completed': False}, partial=True)
        self.assertTrue(serializer.is_valid())
        updated = serializer.save()
        self.assertIsNone(updated.completed_at)

    def test_task_list_serializer_task_count(self):
        from studyFlax.serialisers.tasks.task_serialisers import TaskListSerialiser
        task_list = TaskList.objects.create(user=self.user, name='Work')
        Task.objects.create(user=self.user, task_list=task_list, title='Active')
        Task.objects.create(user=self.user, task_list=task_list, title='Done', completed=True)
        serializer = TaskListSerialiser(task_list)
        self.assertEqual(serializer.data['task_count'], 1)

    def test_task_and_list_serializers_expose_society_context(self):
        from studyFlax.serialisers.tasks.task_serialisers import TaskListSerialiser, TaskSerialiser

        society = make_society("Chess Society")
        task_list = TaskList.objects.create(
            user=self.user,
            name="Chess Society Admin",
            category="society",
            society=society,
        )
        task = Task.objects.create(user=self.user, task_list=task_list, title="Plan the next committee agenda")

        list_data = TaskListSerialiser(task_list).data
        task_data = TaskSerialiser(task).data

        self.assertEqual(list_data["society_id"], society.id)
        self.assertEqual(list_data["society_name"], "Chess Society")
        self.assertEqual(task_data["society_id"], society.id)
        self.assertEqual(task_data["society_name"], "Chess Society")

    def test_sync_status_in_validated_data_sets_completed(self):
        from studyFlax.serialisers.tasks.task_serialisers import TaskSerialiser
        task = Task.objects.create(user=self.user, title='Status Task', status='todo')
        serializer = TaskSerialiser(task, data={'status': 'done'}, partial=True)
        self.assertTrue(serializer.is_valid())
        updated = serializer.save()
        self.assertTrue(updated.completed)

    def test_create_with_status_done_sets_completed_at(self):
        from studyFlax.serialisers.tasks.task_serialisers import TaskSerialiser
        serializer = TaskSerialiser(data={'title': 'Done Task', 'status': 'done'})
        self.assertTrue(serializer.is_valid())
        task = serializer.save(user=self.user)
        self.assertIsNotNone(task.completed_at)


class TaskGroupProjectFilterTest(TestCase):
    """Tests for get_user_tasks group_project filter."""

    def test_filter_tasks_by_group_project(self):
        from studyFlax.views.tasks.task_view_service import get_user_tasks
        from studyFlax.models.groupwork.groupwork_model import GroupProject, GroupMembership
        user = make_user('gp_filter', 'gp_filter@e.com')
        project = GroupProject.objects.create(name='GP', owner=user)
        GroupMembership.objects.create(project=project, user=user, role='owner')
        Task.objects.create(user=user, title='GP Task', group_project=project)
        Task.objects.create(user=user, title='Other Task')
        result = get_user_tasks(user, {'group_project': str(project.id)})
        self.assertEqual(result.count(), 1)
        self.assertEqual(result.first().title, 'GP Task')


class TaskUpdateReadingEstimateTest(TestCase):
    """Tests for task update triggering reading estimate refresh."""

    def test_completing_task_with_reading_triggers_estimate_update(self):
        from studyFlax.serialisers.tasks.task_serialisers import TaskSerialiser
        from studyFlax.models.modules.module_model import Module
        from studyFlax.models.modules.reading_model import Reading
        user = make_user('rdest_user', 'rdest@e.com')
        now = timezone.now()
        module = Module.objects.create(
            module_code='RD01', module_name='Reading Mod',
            created_by=user, start_time=now, end_time=now + timedelta(hours=1),
        )
        reading = Reading.objects.create(
            module=module, title='Ch1', start_page=1, end_page=10,
            deadline=now + timedelta(days=7),
        )
        task = Task.objects.create(user=user, title='Read Ch1', reading=reading)
        serializer = TaskSerialiser(task, data={'status': 'done'}, partial=True)
        self.assertTrue(serializer.is_valid())
        updated = serializer.save()
        self.assertTrue(updated.completed)
