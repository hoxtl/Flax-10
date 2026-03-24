"""
Seed group projects for newly registered users.
Creates one project per enrolled module and adds seeded demo users as teammates.
"""

import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone

from studyFlax.models.groupwork.groupwork_model import GroupMembership, GroupProject
from studyFlax.models.modules.enrollment_model import Enrollment
from studyFlax.management.commands.seed_support.groups.projects import (
    _build_module_project_specs,
)
from studyFlax.views.groupwork.groupwork_limits import MAX_GROUP_PROJECTS_PER_USER

DEMO_USERNAMES = ["janedoe", "johndoe", "charlie"]
MAX_MEMBERS_PER_PROJECT = 4
MIN_MEMBERS_PER_PROJECT = 2


def _get_demo_users():
    User = get_user_model()
    return list(User.objects.filter(username__in=DEMO_USERNAMES))


def _create_project_for_spec(spec, owner, now):
    module = spec["module"]
    source_deadline = spec.get("source_deadline")
    if source_deadline:
        deadline = source_deadline.start_due_date
    else:
        days = random.randint(5, 18)
        deadline = (now + timedelta(days=days)).replace(hour=23, minute=59, second=0, microsecond=0)
    project, created = GroupProject.objects.get_or_create(
        name=spec["name"],
        course_code=module.module_code,
        defaults={"owner": owner, "deadline": deadline},
    )
    if created:
        GroupMembership.objects.get_or_create(project=project, user=owner, defaults={"role": "owner"})
    return project, created


def _add_demo_members(project, owner, demo_users):
    candidates = [u for u in demo_users if u.id != owner.id]
    count = random.randint(MIN_MEMBERS_PER_PROJECT, min(MAX_MEMBERS_PER_PROJECT, len(candidates)))
    members = random.sample(candidates, min(count, len(candidates)))
    for member in members:
        GroupMembership.objects.get_or_create(project=project, user=member, defaults={"role": "member"})


def seed_new_user_projects(user, now=None):
    existing_count = GroupMembership.objects.filter(user=user).count()
    remaining_slots = MAX_GROUP_PROJECTS_PER_USER - existing_count
    if remaining_slots <= 0:
        return 0
    now = now or timezone.now()
    demo_users = _get_demo_users()
    enrollments = list(Enrollment.objects.filter(student=user).select_related("module"))
    modules = [e.module for e in enrollments]
    if not modules:
        return 0
    count = 0
    for module in modules[:remaining_slots]:
        specs = _build_module_project_specs(module, now)
        for spec in specs[:1]:
            project, created = _create_project_for_spec(spec, user, now)
            if created and demo_users:
                _add_demo_members(project, user, demo_users)
                count += 1
            if count >= remaining_slots:
                return count
    return count
