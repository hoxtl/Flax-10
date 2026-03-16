"""
Orchestrates creation of group projects, memberships and group tasks.
"""

import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from studyFlax.models.tasks.taskModel import Task
from studyFlax.models.groupwork.groupwork_models import GroupProject, GroupMembership
from studyFlax.fixtures.groupwork_fixtures import GROUP_PROJECT_FIXTURES, GROUP_TASK_TEMPLATES

User = get_user_model()

FIXTURE_USERNAMES = ['johndoe', 'janedoe', 'charlie']

def _get_fixture_user_map():
    return {u.username: u for u in User.objects.filter(username__in=FIXTURE_USERNAMES)}

def _pick_owner(fixture_user_objs):
    return fixture_user_objs.get(random.choice(FIXTURE_USERNAMES))

def _build_project_defaults(owner, code_prefix, now):
    due = (now + timedelta(days=random.randint(20, 45))).replace(hour=23, minute=59)
    return {'owner': owner, 'course_code': f"{code_prefix}{random.randint(4000, 6000)}", 'deadline': due}

def _create_single_project(name, code_prefix, desc, fixture_user_objs, now):
    owner = _pick_owner(fixture_user_objs)
    if not owner:
        return
    defaults = _build_project_defaults(owner, code_prefix, now)
    project, created = GroupProject.objects.get_or_create(name=name, defaults=defaults)
    if created:
        GroupMembership.objects.get_or_create(project=project, user=owner, defaults={'role': 'owner'})

def create_group_projects(stdout):
    stdout.write("Seeding group projects...")
    now = timezone.now()
    fixture_user_objs = _get_fixture_user_map()
    for name, code_prefix, desc in GROUP_PROJECT_FIXTURES:
        _create_single_project(name, code_prefix, desc, fixture_user_objs, now)

def _add_members_to_project(project, students):
    potential = [s for s in students if s != project.owner]
    count = min(random.randint(1, 2), len(potential))
    members = random.sample(potential, count)
    for m in members:
        GroupMembership.objects.get_or_create(project=project, user=m, defaults={'role': 'member'})

def create_group_memberships(stdout):
    stdout.write("Seeding group memberships...")
    projects = list(GroupProject.objects.all())
    students = list(User.objects.filter(username__in=FIXTURE_USERNAMES))
    for project in projects:
        _add_members_to_project(project, students)

def _pick_status():
    statuses = ['todo', 'in_progress', 'done']
    return random.choice(statuses)

def _build_completed_fields(status):
    is_completed = (status == 'done')
    completed_at = timezone.now() - timedelta(days=random.randint(0, 5)) if is_completed else None
    return is_completed, completed_at

def _create_single_group_task(project, members, due, t_title, t_desc, t_priority, t_blocks):
    status = _pick_status()
    is_completed, completed_at = _build_completed_fields(status)
    task = Task.objects.create(
        user=project.owner, group_project=project,
        title=t_title, description=t_desc,
        priority=t_priority, estimated_blocks=t_blocks,
        status=status, completed=is_completed,
        completed_at=completed_at,
        due_date=due - timedelta(days=random.randint(1, 15)),
    )
    assignees = random.sample(members, random.randint(1, min(2, len(members))))
    task.assigned_to.set(assignees)

def _seed_tasks_for_project(project):
    members = [m.user for m in project.memberships.all()]
    due = project.deadline or (timezone.now() + timedelta(days=30))
    for t_title, t_desc, t_priority, t_blocks in GROUP_TASK_TEMPLATES:
        _create_single_group_task(project, members, due, t_title, t_desc, t_priority, t_blocks)

def create_group_tasks(stdout):
    stdout.write("Seeding group tasks with assignments and statuses...")
    for project in GroupProject.objects.all():
        _seed_tasks_for_project(project)
