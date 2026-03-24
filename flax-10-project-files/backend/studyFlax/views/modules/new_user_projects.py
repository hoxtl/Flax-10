"""
Seeds starter group projects for newly registered users.
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
    """Return seeded demo users for new projects."""

    User = get_user_model()
    return list(User.objects.filter(username__in=DEMO_USERNAMES))


def _generated_project_deadline(now):
    """Return a generated deadline for a new project."""

    days = random.randint(5, 18)
    return (now + timedelta(days=days)).replace(hour=23, minute=59, second=0, microsecond=0)


def _project_deadline(spec, now):
    """Return the deadline for a project specification."""

    source_deadline = spec.get("source_deadline")
    if source_deadline:
        return source_deadline.start_due_date
    return _generated_project_deadline(now)


def _ensure_owner_membership(project, owner):
    """Ensure the project owner has an owner membership."""

    GroupMembership.objects.get_or_create(project=project, user=owner, defaults={"role": "owner"})


def _create_project_for_spec(spec, owner, now):
    """Create a project for the supplied specification."""

    module = spec["module"]
    project, created = GroupProject.objects.get_or_create(
        name=spec["name"],
        course_code=module.module_code,
        defaults={"owner": owner, "deadline": _project_deadline(spec, now)},
    )
    if created:
        _ensure_owner_membership(project, owner)
    return project, created


def _demo_member_candidates(demo_users, owner):
    """Return demo users other than the project owner."""

    return [user for user in demo_users if user.id != owner.id]


def _demo_member_count(candidates):
    """Return the number of demo members to add."""

    lower = min(MIN_MEMBERS_PER_PROJECT, len(candidates))
    upper = min(MAX_MEMBERS_PER_PROJECT, len(candidates))
    return random.randint(lower, upper)


def _selected_demo_members(demo_users, owner):
    """Return the sampled demo members for a project."""

    candidates = _demo_member_candidates(demo_users, owner)
    if not candidates:
        return []
    return random.sample(candidates, _demo_member_count(candidates))


def _add_demo_members(project, owner, demo_users):
    """Add sampled demo members to a project."""

    for member in _selected_demo_members(demo_users, owner):
        GroupMembership.objects.get_or_create(project=project, user=member, defaults={"role": "member"})


def _remaining_project_slots(user):
    """Return how many more projects the user can join."""

    existing_count = GroupMembership.objects.filter(user=user).count()
    return MAX_GROUP_PROJECTS_PER_USER - existing_count


def _enrolled_modules(user):
    """Return enrolled modules for the user."""

    enrollments = Enrollment.objects.filter(student=user).select_related("module")
    return [enrollment.module for enrollment in enrollments]


def _first_project_spec(module, now):
    """Return the first seeded project specification for a module."""

    specs = _build_module_project_specs(module, now)
    return specs[0] if specs else None


def _seed_project_for_module(module, user, now, demo_users):
    """Seed one project for a module when a specification exists."""

    spec = _first_project_spec(module, now)
    if not spec:
        return False
    project, created = _create_project_for_spec(spec, user, now)
    if created and demo_users:
        _add_demo_members(project, user, demo_users)
    return created


def _seed_projects_for_modules(user, modules, now, demo_users, remaining_slots):
    """Seed projects until the remaining slot limit is reached."""

    count = 0
    for module in modules[:remaining_slots]:
        count += int(_seed_project_for_module(module, user, now, demo_users))
    return count


def seed_new_user_projects(user, now=None):
    """Seed starter projects for a newly registered user."""

    remaining_slots = _remaining_project_slots(user)
    if remaining_slots <= 0:
        return 0
    modules = _enrolled_modules(user)
    if not modules:
        return 0
    return _seed_projects_for_modules(user, modules, now or timezone.now(), _get_demo_users(), remaining_slots)
