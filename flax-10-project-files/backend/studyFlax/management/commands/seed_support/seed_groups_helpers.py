import random

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from studyFlax.models.groupwork.groupwork_model import GroupProject, GroupMembership
from studyFlax.models.modules.enrollment_model import Enrollment

User = get_user_model()

PROJECT_OWNER_SEED = "studyflax-group-project-owners"
PROJECT_MEMBER_SEED = "studyflax-group-project-members"
PROJECT_TASK_SEED = "studyflax-group-project-tasks"
PROJECT_SHOWCASE_USERNAME = "janedoe"
FIXTURE_USERNAMES = ["janedoe", "johndoe", "charlie"]
FIXTURE_OWNER_MIN_PROJECTS = 2
PROJECT_DEADLINE_OFFSETS = (2, 5, 7, 10, 12, 15, 17, 19)
URGENT_PROJECT_LIMIT = 3
MIN_PROJECT_MEMBER_TOTAL = 5
MAX_PROJECT_MEMBER_TOTAL = 8
MIN_PROJECTS_PER_STUDENT = 5
MAX_PROJECTS_PER_STUDENT = 8
SEEDED_SUGGESTION_COUNT = 4
SEEDED_SUGGESTION_WINDOWS = (
    (1, 10),
    (2, 14),
    (3, 17),
    (4, 11),
    (5, 15),
    (6, 13),
)
SEEDED_RESPONSE_PATTERNS = (
    ("accepted", "accepted", "accepted", "accepted", "accepted"),
    ("accepted", "accepted", "pending", "accepted", "rejected"),
    ("accepted", "pending", "accepted", "rejected", "accepted"),
    ("accepted", "rejected", "accepted", "accepted", "pending"),
)
PROJECT_TYPE_TEMPLATES = {
    "technical": ["prototype review", "sprint presentation", "solution walkthrough"],
    "lab": ["research poster", "findings deck", "methods showcase"],
    "analysis": ["case study workshop", "insight presentation", "research summary"],
    "default": ["group presentation", "research workshop", "strategy deck"],
}
GENERIC_SUBJECT_WORDS = {
    "analysis", "assignment", "case", "coursework", "deck", "discussion", "essay",
    "final", "findings", "group", "lab", "methods", "oral", "paper", "poster",
    "presentation", "problem", "project", "report", "research", "review", "seminar",
    "session", "sheet", "showcase", "study", "submission", "summary", "workshop",
    "writeup",
}
PROJECT_TASK_STATUS_PATTERNS = (
    ("todo", "todo", "in_progress", "todo", "todo"),
    ("done", "in_progress", "todo", "todo", "todo"),
    ("done", "done", "in_progress", "todo", "todo"),
    ("done", "done", "in_progress", "in_progress", "todo"),
    ("done", "done", "done", "in_progress", "todo"),
    ("done", "done", "done", "done", "todo"),
)
ZERO_PROGRESS_PROJECT_COUNT = 0


def _get_student_pool():
    return list(
        User.objects.filter(Q(role='student') | Q(username__in=FIXTURE_USERNAMES))
        .distinct()
        .order_by('username')
    )


def _pick_owner(students, rng):
    return rng.choice(students) if students else None


def _get_showcase_student(students):
    return next((s for s in students if s.username == PROJECT_SHOWCASE_USERNAME), None)


def _include_user(user, seen):
    if not user or user.id in seen:
        return False
    seen.add(user.id)
    return True


def _dedupe_users(users):
    seen = set()
    return [user for user in users if _include_user(user, seen)]


def _build_enrollment_maps(students):
    student_modules = {}
    module_students = {}
    enrollments = (
        Enrollment.objects.filter(student__in=students)
        .select_related("student", "module")
        .order_by("student__username", "module__module_code")
    )
    for enrollment in enrollments:
        student_modules.setdefault(enrollment.student_id, []).append(enrollment.module)
        module_students.setdefault(enrollment.module.module_code, []).append(enrollment.student)
    module_students = {code: _dedupe_users(users) for code, users in module_students.items()}
    return student_modules, module_students


def _list_seed_modules(student_modules):
    seen = set()
    flat = [m for module_list in student_modules.values() for m in module_list]
    return [m for m in flat if m.module_code not in seen and not seen.add(m.module_code)]


def _has_reached_project_limit(student):
    return GroupMembership.objects.filter(user=student).count() >= MAX_PROJECTS_PER_STUDENT


def _eligible_students(students):
    return [s for s in students if not _has_reached_project_limit(s)]


def _pick_from_module(module, module_students, rng):
    module_members = _eligible_students(module_students.get(module.module_code, []))
    return rng.choice(module_members) if module_members else None


def _pick_owner_for_module(module, students, module_students, rng):
    eligible = _eligible_students(students)
    if not eligible:
        return None
    module_choice = _pick_from_module(module, module_students, rng) if module else None
    return module_choice or _pick_owner(eligible, rng)


def _sync_project_owner_membership(project, owner):
    GroupMembership.objects.filter(project=project, role='owner').exclude(user=owner).update(role='member')
    GroupMembership.objects.update_or_create(project=project, user=owner, defaults={'role': 'owner'})


def _update_existing_project(project, defaults):
    for field, value in defaults.items():
        setattr(project, field, value)
    project.save(update_fields=list(defaults.keys()))


def _create_single_project(spec, students, now, rng, index, module_students):
    from studyFlax.management.commands.seed_support.seed_groups_names import _build_project_defaults
    module = spec["module"]
    owner = _pick_owner_for_module(module, students, module_students, rng)
    if not owner:
        return
    defaults = _build_project_defaults(owner, module, now, index, source_deadline=spec.get("source_deadline"))
    project, created = GroupProject.objects.get_or_create(name=spec["name"], course_code=defaults["course_code"], defaults=defaults)
    if not created:
        _update_existing_project(project, defaults)
    _sync_project_owner_membership(project, owner)


def _build_seed_project_context_data(students, reference_now):
    from studyFlax.management.commands.seed_support.seed_groups_names import _build_project_specs
    showcase_student = _get_showcase_student(students)
    student_modules, module_students = _build_enrollment_maps(students)
    seed_modules = _list_seed_modules(student_modules)
    specs = _build_project_specs(showcase_student, student_modules, seed_modules, reference_now)
    return showcase_student, student_modules, module_students, seed_modules, specs


def _filter_seeded_projects(seed_modules, specs):
    allowed_keys = {(spec["name"], spec["module"].module_code) for spec in specs}
    allowed_codes = [module.module_code for module in seed_modules]
    projects = [
        p for p in GroupProject.objects.filter(course_code__in=allowed_codes)
        if (p.name, p.course_code) in allowed_keys
    ]
    return allowed_keys, projects


def _build_seed_project_context(now=None):
    reference_now = now or timezone.now()
    students = _get_student_pool()
    showcase_student, student_modules, module_students, seed_modules, specs = _build_seed_project_context_data(students, reference_now)
    allowed_keys, projects = _filter_seeded_projects(seed_modules, specs)
    return {
        "students": students,
        "showcase_student": showcase_student,
        "student_modules": student_modules,
        "module_students": module_students,
        "seed_modules": seed_modules,
        "allowed_keys": allowed_keys,
        "projects": projects,
    }


def _fixture_seed_users(students):
    usernames = set(FIXTURE_USERNAMES)
    return [s for s in students if s.username in usernames]


def _student_module_codes(student_modules):
    return {
        student_id: {m.module_code for m in modules if m and m.module_code}
        for student_id, modules in student_modules.items()
    }


def _tally_ownership(project, ownership_counts):
    if project.owner_id in ownership_counts:
        ownership_counts[project.owner_id] += 1


def _count_ownerships(projects, targets):
    ownership_counts = {student.id: 0 for student in targets}
    for project in projects:
        _tally_ownership(project, ownership_counts)
    return ownership_counts


def _transfer_ownership(candidate, student, ownership_counts):
    previous_owner_id = candidate.owner_id
    candidate.owner = student
    candidate.save(update_fields=["owner"])
    _sync_project_owner_membership(candidate, student)
    ownership_counts[student.id] = ownership_counts.get(student.id, 0) + 1
    if previous_owner_id in ownership_counts:
        ownership_counts[previous_owner_id] = max(ownership_counts.get(previous_owner_id, 1) - 1, 0)


def _needs_more_ownership(student, ownership_counts):
    return ownership_counts.get(student.id, 0) < FIXTURE_OWNER_MIN_PROJECTS


def _assign_fixture_ownership(student, projects, target_module_codes, ownership_counts, rng):
    from studyFlax.management.commands.seed_support.seed_groups_membership import _pick_project_for_fixture_owner
    candidate = _pick_project_for_fixture_owner(student, projects, target_module_codes, ownership_counts, rng)
    while candidate and _needs_more_ownership(student, ownership_counts):
        _transfer_ownership(candidate, student, ownership_counts)
        candidate = _pick_project_for_fixture_owner(student, projects, target_module_codes, ownership_counts, rng)


def _ensure_fixture_users_own_projects(student_modules, rng):
    context = _build_seed_project_context(timezone.now())
    projects = list(context["projects"])
    targets = _fixture_seed_users(context["students"])
    if not projects or not targets:
        return
    target_module_codes = _student_module_codes(student_modules)
    ownership_counts = _count_ownerships(projects, targets)
    for student in targets:
        _assign_fixture_ownership(student, projects, target_module_codes, ownership_counts, rng)
