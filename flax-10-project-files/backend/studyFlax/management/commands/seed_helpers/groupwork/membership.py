"""
Membership management helpers for group project seeding.
"""

from datetime import timedelta

from django.db.models import Count
from django.utils import timezone

from studyFlax.models.groupwork.groupwork_model import GroupMembership
from studyFlax.models.modules.enrollment_model import Enrollment


MIN_PROJECT_MEMBER_TOTAL = 5
MAX_PROJECT_MEMBER_TOTAL = 10
MIN_PROJECTS_PER_STUDENT = 4
MAX_PROJECTS_PER_STUDENT = 12


def _add_if_unique(user, seen, unique_users):
    if not user or user.id in seen:
        return
    seen.add(user.id)
    unique_users.append(user)

def _dedupe_users(users):
    seen = set()
    unique_users = []
    for user in users:
        _add_if_unique(user, seen, unique_users)
    return unique_users

def _add_enrollment_to_maps(enrollment, student_modules, module_students):
    """Update both enrollment maps in-place for a single enrollment."""
    student_modules.setdefault(enrollment.student_id, []).append(enrollment.module)
    module_students.setdefault(enrollment.module.module_code, []).append(enrollment.student)

def _build_enrollment_maps(students):
    student_modules = {}
    module_students = {}
    enrollments = (
        Enrollment.objects.filter(student__in=students)
        .select_related("student", "module")
        .order_by("student__username", "module__module_code")
    )
    for enrollment in enrollments:
        _add_enrollment_to_maps(enrollment, student_modules, module_students)
    module_students = {code: _dedupe_users(users) for code, users in module_students.items()}
    return student_modules, module_students

def _add_unique_module(module, seen, modules):
    if module.module_code in seen:
        return
    seen.add(module.module_code)
    modules.append(module)

def _collect_modules_from_list(module_list, seen, modules):
    for module in module_list:
        _add_unique_module(module, seen, modules)

def _list_seed_modules(student_modules):
    seen = set()
    modules = []
    for module_list in student_modules.values():
        _collect_modules_from_list(module_list, seen, modules)
    return modules

def _pick_owner(students, rng):
    return rng.choice(students) if students else None

def _has_reached_project_limit(student):
    """Return True if the student is already at the project cap."""
    return GroupMembership.objects.filter(user=student).count() >= MAX_PROJECTS_PER_STUDENT

def _eligible_module_members(module, module_students):
    return [s for s in module_students.get(module.module_code, []) if not _has_reached_project_limit(s)]

def _pick_from_module_members(module, module_students, rng):
    if not module:
        return None
    members = _eligible_module_members(module, module_students)
    return rng.choice(members) if members else None

def _pick_owner_for_module(module, students, module_students, rng):
    eligible_students = [s for s in students if not _has_reached_project_limit(s)]
    if not eligible_students:
        return None
    module_pick = _pick_from_module_members(module, module_students, rng)
    return module_pick if module_pick else _pick_owner(eligible_students, rng)

def _get_showcase_student_modules(showcase_student, student_modules):
    if not showcase_student:
        return []
    return student_modules.get(showcase_student.id, [])

def _showcase_modules(showcase_student, student_modules, seed_modules):
    modules = _get_showcase_student_modules(showcase_student, student_modules)
    return modules if modules else seed_modules

def _select_project_cohort(project, students, module_students):
    cohort = _dedupe_users(module_students.get(project.course_code, []))
    if len(cohort) >= MIN_PROJECT_MEMBER_TOTAL:
        return cohort
    fallback_students = [student for student in students if student.id not in {member.id for member in cohort}]
    return _dedupe_users(cohort + fallback_students)

def _build_membership_counts(students, project_ids=None):
    counts = {student.id: 0 for student in students}
    memberships = GroupMembership.objects.filter(user__in=students)
    if project_ids is not None:
        memberships = memberships.filter(project_id__in=project_ids)
    rows = memberships.values("user").annotate(total=Count("id"))
    for row in rows:
        counts[row["user"]] = row["total"]
    return counts

def _rank_member(student, project, cohort_ids, membership_counts, rng):
    """Return a sort key tuple for ranking a candidate member."""
    current_count = membership_counts.get(student.id, 0)
    return (
        0 if current_count < MIN_PROJECTS_PER_STUDENT else 1,
        0 if student.id in cohort_ids else 1,
        0 if current_count < MAX_PROJECTS_PER_STUDENT else 1,
        current_count,
        rng.random(),
    )

def _is_eligible_candidate(student, project, membership_counts, allow_over_limit):
    if student == project.owner:
        return False
    current_count = membership_counts.get(student.id, 0)
    return allow_over_limit or current_count < MAX_PROJECTS_PER_STUDENT

def _ordered_member_candidates(project, students, module_students, membership_counts, rng, allow_over_limit=False):
    cohort = _select_project_cohort(project, students, module_students)
    cohort_ids = {s.id for s in cohort}
    ranked = [
        (_rank_member(s, project, cohort_ids, membership_counts, rng), s)
        for s in _dedupe_users(cohort + students)
        if _is_eligible_candidate(s, project, membership_counts, allow_over_limit)
    ]
    ranked.sort(key=lambda item: item[0])
    return [s for _, s in ranked]

def _add_members_to_project(project, students, rng, showcase_student, module_students, membership_counts):
    del showcase_student
    candidate_pool = _ordered_member_candidates(project, students, module_students, membership_counts, rng)
    max_total = min(MAX_PROJECT_MEMBER_TOTAL, 1 + len(candidate_pool))
    if max_total <= 1:
        target_total = 1
    else:
        requested_total = rng.randint(MIN_PROJECT_MEMBER_TOTAL, MAX_PROJECT_MEMBER_TOTAL)
        minimum_total = min(MIN_PROJECT_MEMBER_TOTAL, max_total)
        target_total = max(minimum_total, min(requested_total, max_total))
    members = candidate_pool[:max(target_total - 1, 0)]
    selected_ids = {member.id for member in members}
    GroupMembership.objects.filter(project=project).exclude(user=project.owner).exclude(user_id__in=selected_ids).delete()
    for member in members:
        GroupMembership.objects.update_or_create(project=project, user=member, defaults={"role": "member"})
        membership_counts[member.id] = membership_counts.get(member.id, 0) + 1

def _student_module_codes(student_modules):
    return {
        student_id: {module.module_code for module in modules if module and module.module_code}
        for student_id, modules in student_modules.items()
    }

def _project_member_sets(projects):
    return {
        project.id: {membership.user_id for membership in project.memberships.all()}
        for project in projects
    }

def _is_eligible_for_top_up(project, student, member_sets):
    members = member_sets.get(project.id, set())
    return student.id not in members and len(members) < MAX_PROJECT_MEMBER_TOTAL

def _rank_top_up_project(project, student_module_codes, member_sets, rng):
    return (0 if project.course_code in student_module_codes else 1, len(member_sets.get(project.id, set())), rng.random())

def _ordered_top_up_projects(student, projects, member_sets, module_codes, rng):
    student_module_codes = module_codes.get(student.id, set())
    ranked = [
        (_rank_top_up_project(project, student_module_codes, member_sets, rng), project)
        for project in projects
        if _is_eligible_for_top_up(project, student, member_sets)
    ]
    ranked.sort(key=lambda item: item[0])
    return [project for _, project in ranked]

def _top_up_single_student(student, projects, member_sets, module_codes, membership_counts, rng):
    """Top up one student's memberships to the minimum. Returns True if any were added."""
    candidate_projects = _ordered_top_up_projects(student, projects, member_sets, module_codes, rng)
    made_progress = False
    while membership_counts.get(student.id, 0) < MIN_PROJECTS_PER_STUDENT and candidate_projects:
        project = candidate_projects.pop(0)
        GroupMembership.objects.update_or_create(
            project=project,
            user=student,
            defaults={"role": "member"},
        )
        member_sets.setdefault(project.id, set()).add(student.id)
        membership_counts[student.id] = membership_counts.get(student.id, 0) + 1
        made_progress = True
    return made_progress

def _under_assigned_sorted(students, membership_counts):
    under = [s for s in students if membership_counts.get(s.id, 0) < MIN_PROJECTS_PER_STUDENT]
    under.sort(key=lambda s: (membership_counts.get(s.id, 0), s.username))
    return under

def _process_top_up_pass(students, membership_counts, projects, member_sets, module_codes, rng):
    results = [
        _top_up_single_student(s, projects, member_sets, module_codes, membership_counts, rng)
        for s in _under_assigned_sorted(students, membership_counts)
    ]
    return any(results)

def _top_up_students_to_minimum(projects, students, student_modules, membership_counts, rng):
    module_codes = _student_module_codes(student_modules)
    member_sets = _project_member_sets(projects)
    while _process_top_up_pass(students, membership_counts, projects, member_sets, module_codes, rng):
        pass

def _underfilled_projects(projects, member_sets):
    """Return projects with fewer than the minimum members, sorted by fill level."""
    return sorted(
        [project for project in projects if len(member_sets.get(project.id, set())) < MIN_PROJECT_MEMBER_TOTAL],
        key=lambda project: (len(member_sets.get(project.id, set())), project.deadline or timezone.now(), project.name),
    )

def _try_add_member(member, project, member_sets, membership_counts):
    """Add member to project if not already present. Returns 1 if added, 0 otherwise."""
    if member.id in member_sets.get(project.id, set()):
        return 0
    GroupMembership.objects.update_or_create(project=project, user=member, defaults={"role": "member"})
    member_sets.setdefault(project.id, set()).add(member.id)
    membership_counts[member.id] = membership_counts.get(member.id, 0) + 1
    return 1

def _eligible_to_add(member, project, member_sets):
    return member.id not in member_sets.get(project.id, set())

def _fill_from_candidates(project, candidates, needed, member_sets, membership_counts):
    """Add up to needed members from candidates. Returns (made_progress, remaining_needed)."""
    eligible = [m for m in candidates if _eligible_to_add(m, project, member_sets)]
    added = sum(_try_add_member(m, project, member_sets, membership_counts) for m in eligible[:max(needed, 0)])
    return added > 0, needed - added

def _fill_project_pass(project, students, module_students, membership_counts, member_sets, rng, allow_over_limit, needed):
    candidates = _ordered_member_candidates(project, students, module_students, membership_counts, rng, allow_over_limit=allow_over_limit)
    return _fill_from_candidates(project, candidates, needed, member_sets, membership_counts)

def _fill_project_to_minimum(project, students, module_students, membership_counts, member_sets, rng):
    """Fill one project up to the minimum member count. Returns True if any member was added."""
    needed = MIN_PROJECT_MEMBER_TOTAL - len(member_sets.get(project.id, set()))
    made_first, remaining = _fill_project_pass(project, students, module_students, membership_counts, member_sets, rng, False, needed)
    made_second, _ = _fill_project_pass(project, students, module_students, membership_counts, member_sets, rng, True, remaining)
    return made_first or made_second

def _fill_underfilled_pass(projects, students, module_students, membership_counts, member_sets, rng):
    results = [
        _fill_project_to_minimum(p, students, module_students, membership_counts, member_sets, rng)
        for p in _underfilled_projects(projects, member_sets)
    ]
    return any(results)

def _ensure_projects_have_minimum_members(projects, students, module_students, membership_counts, rng):
    member_sets = _project_member_sets(projects)
    while _fill_underfilled_pass(projects, students, module_students, membership_counts, member_sets, rng):
        pass

def _fill_solo_project(project, students, module_students, membership_counts, member_sets, rng):
    """Add members to a solo project until it has at least 2. Returns True if any were added."""
    needed = 2 - len(member_sets.get(project.id, set()))
    candidates = _ordered_member_candidates(project, students, module_students, membership_counts, rng, allow_over_limit=True)
    made, _ = _fill_from_candidates(project, candidates, needed, member_sets, membership_counts)
    return made
# One project per member count in [5..10], plus extras to reach 8 total spread entries
SPREAD_TARGETS = [5, 5, 6, 6, 7, 8, 9, 10]

def _fill_project_to_target(project, target, students, module_students, membership_counts, member_sets, rng):
    current = len(member_sets.get(project.id, set()))
    needed = target - current
    if needed <= 0:
        return
    candidates = _ordered_member_candidates(project, students, module_students, membership_counts, rng, allow_over_limit=True)
    _fill_from_candidates(project, candidates, needed, member_sets, membership_counts)

def ensure_member_count_spread(projects, students, module_students, membership_counts, rng):
    """Guarantee one project at each member count from MIN to MAX, random counts for the rest."""
    if not projects:
        return
    member_sets = _project_member_sets(projects)
    sorted_projects = sorted(projects, key=lambda p: len(member_sets.get(p.id, set())))
    spread_count = len(SPREAD_TARGETS)
    spread_projects = sorted_projects[:spread_count]
    for project, target in zip(spread_projects, SPREAD_TARGETS):
        _fill_project_to_target(project, target, students, module_students, membership_counts, member_sets, rng)
    if not any(len(member_sets.get(p.id, set())) >= MAX_PROJECT_MEMBER_TOTAL for p in projects):
        best = max(sorted_projects, key=lambda p: len(member_sets.get(p.id, set())))
        _fill_project_to_target(best, MAX_PROJECT_MEMBER_TOTAL, students, module_students, membership_counts, member_sets, rng)
    for project in sorted_projects[spread_count:]:
        target = rng.randint(MIN_PROJECT_MEMBER_TOTAL, MAX_PROJECT_MEMBER_TOTAL)
        _fill_project_to_target(project, target, students, module_students, membership_counts, member_sets, rng)

def _ensure_projects_have_teammates(projects, students, module_students, membership_counts, rng):
    member_sets = _project_member_sets(projects)
    solo_projects = sorted(
        [project for project in projects if len(member_sets.get(project.id, set())) < 2],
        key=lambda project: (len(member_sets.get(project.id, set())), project.deadline or timezone.now(), project.name),
    )
    for project in solo_projects:
        _fill_solo_project(project, students, module_students, membership_counts, member_sets, rng)

def _membership_trim_sort_key(membership, preferred_module_codes, member_sets):
    project = membership.project
    return (
        0 if project.course_code not in preferred_module_codes else 1,
        -(len(member_sets.get(project.id, set()))),
        project.deadline or timezone.now() + timedelta(days=3650),
        project.name,
    )

def _can_trim_membership(membership, member_sets):
    return len(member_sets.get(membership.project_id, set())) > MIN_PROJECT_MEMBER_TOTAL

def _do_trim_membership(membership, student, member_sets, membership_counts):
    current_members = member_sets.get(membership.project_id, set())
    membership.delete()
    current_members.discard(student.id)
    membership_counts[student.id] = max(membership_counts.get(student.id, 0) - 1, 0)

def _sorted_trimmable_memberships(student, allowed_ids, preferred_codes, member_sets):
    memberships = list(
        GroupMembership.objects.filter(user=student, project_id__in=allowed_ids)
        .exclude(role="owner")
        .select_related("project")
    )
    memberships.sort(key=lambda m: _membership_trim_sort_key(m, preferred_codes.get(student.id, set()), member_sets))
    return memberships

def _trim_student_memberships(student, projects, preferred_codes, member_sets, membership_counts, allowed_ids):
    """Trim one student's memberships down to the project cap. Mutates member_sets and membership_counts."""
    overflow = membership_counts.get(student.id, 0) - MAX_PROJECTS_PER_STUDENT
    if overflow <= 0:
        return
    trimmable = [m for m in _sorted_trimmable_memberships(student, allowed_ids, preferred_codes, member_sets) if _can_trim_membership(m, member_sets)]
    for membership in trimmable[:overflow]:
        _do_trim_membership(membership, student, member_sets, membership_counts)

def _trim_students_to_project_cap(projects, students, student_modules, membership_counts):
    allowed_project_ids = [project.id for project in projects]
    preferred_module_codes = _student_module_codes(student_modules)
    member_sets = _project_member_sets(projects)
    for student in students:
        _trim_student_memberships(student, projects, preferred_module_codes, member_sets, membership_counts, allowed_project_ids)
