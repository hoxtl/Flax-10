import random

from django.core.management.base import BaseCommand
from django.db.models.signals import post_save
from django.utils import timezone

from studyFlax.models.groupwork.groupwork_model import GroupMembership
from studyFlax.management.commands.seed_support.seed_groups_helpers import (
    PROJECT_OWNER_SEED,
    PROJECT_MEMBER_SEED,
    _get_student_pool,
    _get_showcase_student,
    _build_enrollment_maps,
    _list_seed_modules,
    _create_single_project,
    _ensure_fixture_users_own_projects,
    _build_seed_project_context,
)
from studyFlax.management.commands.seed_support.seed_groups_names import _build_project_specs
from studyFlax.management.commands.seed_support.seed_groups_membership import (
    _build_membership_counts,
    _add_members_to_project,
    _top_up_students_to_minimum,
    _ensure_projects_have_minimum_members,
    _ensure_projects_have_teammates,
    _seed_tasks_for_project,
    _seed_busy_events_for_member,
    _seed_meeting_suggestions_for_project,
)

def create_group_projects():
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


def create_group_memberships(stdout):
    stdout.write("Seeding group memberships...")
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
        _seed_all_memberships(projects, students, showcase_student, module_students, student_modules, membership_counts, rng)
    finally:
        post_save.connect(notify_on_added_to_project, sender=GroupMembership)


def _seed_all_memberships(projects, students, showcase_student, module_students, student_modules, membership_counts, rng):
    for project in projects:
        _add_members_to_project(project, students, rng, showcase_student, module_students, membership_counts)
    _top_up_students_to_minimum(projects, students, student_modules, membership_counts, rng)
    _ensure_projects_have_minimum_members(projects, students, module_students, membership_counts, rng)
    _ensure_projects_have_teammates(projects, students, module_students, membership_counts, rng)


def create_group_tasks(stdout):
    stdout.write("Seeding group tasks with assignments and statuses...")
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
    stdout.write("Seeding group availability data (busy events + meeting suggestions)...")
    now = timezone.now()
    context = _build_seed_project_context(now)
    for project in context["projects"]:
        _seed_project_availability(project, now)
    stdout.write("Done seeding group availability.")


class Command(BaseCommand):
    help = "Seed group projects, memberships, tasks, and availability data."

    def handle(self, *args, **options):
        create_group_projects()
        create_group_memberships(self.stdout)
        create_group_tasks(self.stdout)
        seed_group_availability(self.stdout)
