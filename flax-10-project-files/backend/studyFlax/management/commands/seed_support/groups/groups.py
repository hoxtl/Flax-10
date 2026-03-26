"""
Orchestrates creation of group projects, memberships and group tasks.
"""

import random

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.db.models.signals import post_save
from django.utils import timezone

from studyFlax.models.groupwork.groupwork_model import GroupProject, GroupMembership
from .projects import (
    _build_project_specs,
    _build_project_defaults,
    _create_single_project,
    _sync_project_owner_membership,
    PROJECT_DEADLINE_OFFSETS,
    URGENT_PROJECT_LIMIT,
    GENERIC_SUBJECT_WORDS,
    PROJECT_TYPE_TEMPLATES,
    ZERO_PROGRESS_PROJECT_COUNT,
)
from .membership import (
    _build_enrollment_maps,
    _list_seed_modules,
    _pick_owner_for_module,
    _add_members_to_project,
    _student_module_codes,
    _top_up_students_to_minimum,
    _ensure_projects_have_minimum_members,
    _ensure_projects_have_teammates,
    _trim_students_to_project_cap,
    _build_membership_counts,
    ensure_member_count_spread,
    _fixture_seed_users,
    _pick_project_for_fixture_owner,
    FIXTURE_USERNAMES,
    FIXTURE_OWNER_MIN_PROJECTS,
    MIN_PROJECT_MEMBER_TOTAL,
    MAX_PROJECT_MEMBER_TOTAL,
    MIN_PROJECTS_PER_STUDENT,
    MAX_PROJECTS_PER_STUDENT,
)
from .tasks import (
    _seed_tasks_for_project,
    PROJECT_TASK_STATUS_PATTERNS,
)
from .availability import (
    _seed_busy_events_for_member,
    _seed_meeting_suggestions_for_project,
    SEEDED_SUGGESTION_COUNT,
    SEEDED_SUGGESTION_WINDOWS,
    SEEDED_RESPONSE_PATTERNS,
)

User = get_user_model()

PROJECT_OWNER_SEED = "studyflax-group-project-owners"
PROJECT_MEMBER_SEED = "studyflax-group-project-members"
PROJECT_TASK_SEED = "studyflax-group-project-tasks"
PROJECT_SHOWCASE_USERNAME = "janedoe"


def _get_student_pool():
    return list(
        User.objects.filter(Q(role='student') | Q(username__in=FIXTURE_USERNAMES))
        .distinct()
        .order_by('username')
    )

def _get_showcase_student(students):
    return next((s for s in students if s.username == PROJECT_SHOWCASE_USERNAME), None)

def _get_deadline_offset(index):
    return PROJECT_DEADLINE_OFFSETS[index % len(PROJECT_DEADLINE_OFFSETS)]

def _has_reached_project_limit(student):
    return GroupMembership.objects.filter(user=student).count() >= MAX_PROJECTS_PER_STUDENT

def _pick_owner(students, rng):
    return rng.choice(students) if students else None

def _filter_seed_projects(allowed_codes, allowed_keys):
    """Return only projects that match the seeded specs."""

    return [
        project for project in GroupProject.objects.filter(course_code__in=allowed_codes)
        if (project.name, project.course_code) in allowed_keys
    ]

def _build_seed_project_context(now=None):
    reference_now = now or timezone.now()
    students = _get_student_pool()
    showcase_student = _get_showcase_student(students)
    student_modules, module_students = _build_enrollment_maps(students)
    seed_modules = _list_seed_modules(student_modules)
    specs = _build_project_specs(showcase_student, student_modules, seed_modules, reference_now)
    allowed_keys = {(spec["name"], spec["module"].module_code) for spec in specs}
    allowed_codes = [module.module_code for module in seed_modules]
    return {
        "students": students,
        "showcase_student": showcase_student,
        "student_modules": student_modules,
        "module_students": module_students,
        "seed_modules": seed_modules,
        "allowed_keys": allowed_keys,
        "projects": _filter_seed_projects(allowed_codes, allowed_keys),
    }

def _count_fixture_ownership(projects, targets):
    counts = {s.id: 0 for s in targets}
    owner_ids = [p.owner_id for p in projects if p.owner_id in counts]
    for owner_id in owner_ids:
        counts[owner_id] += 1
    return counts

def _assign_fixture_owner(student, projects, target_module_codes, ownership_counts, rng):
    """Assign one more project to student as owner. Returns True if successful."""

    candidate = _pick_project_for_fixture_owner(student, projects, target_module_codes, ownership_counts, rng)
    if not candidate:
        return False
    previous_owner_id = candidate.owner_id
    candidate.owner = student
    candidate.save(update_fields=["owner"])
    _sync_project_owner_membership(candidate, student)
    ownership_counts[student.id] = ownership_counts.get(student.id, 0) + 1
    if previous_owner_id in ownership_counts:
        ownership_counts[previous_owner_id] = max(ownership_counts.get(previous_owner_id, 1) - 1, 0)
    return True

def _top_up_fixture_owner(student, projects, target_module_codes, ownership_counts, rng):
    """Ensure student owns at least FIXTURE_OWNER_MIN_PROJECTS projects."""

    can_assign = True
    while can_assign and ownership_counts.get(student.id, 0) < FIXTURE_OWNER_MIN_PROJECTS:
        can_assign = _assign_fixture_owner(student, projects, target_module_codes, ownership_counts, rng)

def _ensure_fixture_users_own_projects(student_modules, rng):
    context = _build_seed_project_context(timezone.now())
    projects = list(context["projects"])
    targets = _fixture_seed_users(context["students"])
    if not projects or not targets:
        return
    target_module_codes = _student_module_codes(student_modules)
    ownership_counts = _count_fixture_ownership(projects, targets)
    for student in targets:
        _top_up_fixture_owner(student, projects, target_module_codes, ownership_counts, rng)

def create_group_projects(stdout):
    """Create the seeded group projects."""

    now = timezone.now()
    rng = random.Random(PROJECT_OWNER_SEED)
    students = _get_student_pool()
    showcase_student = _get_showcase_student(students)
    student_modules, module_students = _build_enrollment_maps(students)
    seed_modules = _list_seed_modules(student_modules)
    specs = _build_project_specs(showcase_student, student_modules, seed_modules, now)
    for index, spec in enumerate(specs):
        _create_single_project(spec, students, now, rng, index, module_students)
    _ensure_fixture_users_own_projects(student_modules, rng)

def _run_membership_seeding(projects, students, showcase_student, student_modules, module_students, membership_counts, rng):
    for project in projects:
        _add_members_to_project(project, students, rng, showcase_student, module_students, membership_counts)
    _top_up_students_to_minimum(projects, students, student_modules, membership_counts, rng)
    _ensure_projects_have_minimum_members(projects, students, module_students, membership_counts, rng)
    _ensure_projects_have_teammates(projects, students, module_students, membership_counts, rng)
    _trim_students_to_project_cap(projects, students, student_modules, membership_counts)
    ensure_member_count_spread(projects, students, module_students, membership_counts, rng)

def create_group_memberships(stdout):
    """Create the seeded memberships for all seeded group projects."""

    rng = random.Random(PROJECT_MEMBER_SEED)
    context = _build_seed_project_context(timezone.now())
    students = context["students"]
    showcase_student = context["showcase_student"]
    student_modules = context["student_modules"]
    module_students = context["module_students"]
    projects = context["projects"]
    allowed_project_ids = [project.id for project in projects]
    GroupMembership.objects.filter(project_id__in=allowed_project_ids).exclude(role="owner").delete()
    membership_counts = _build_membership_counts(students, allowed_project_ids)
    from studyFlax.signals.groupwork_notifications import notify_on_added_to_project
    post_save.disconnect(notify_on_added_to_project, sender=GroupMembership)
    try:
        _run_membership_seeding(projects, students, showcase_student, student_modules, module_students, membership_counts, rng)
    finally:
        post_save.connect(notify_on_added_to_project, sender=GroupMembership)

def create_group_tasks(stdout):
    """Create the seeded task sets for all seeded group projects."""

    now = timezone.now()
    context = _build_seed_project_context(now)
    projects = sorted(context["projects"], key=lambda project: (project.course_code, project.name))
    for project_index, project in enumerate(projects):
        _seed_tasks_for_project(project, now, project_index)

def _seed_project_availability(project, now):
    members = [m.user for m in project.memberships.select_related("user").all()]
    if len(members) < 2:
        return
    for member in members:
        _seed_busy_events_for_member(member, project.id, now)
    _seed_meeting_suggestions_for_project(project, members, now)

def seed_group_availability(stdout):
    """Seed availability events and meeting suggestions for group projects."""

    now = timezone.now()
    context = _build_seed_project_context(now)
    for project in context["projects"]:
        _seed_project_availability(project, now)
