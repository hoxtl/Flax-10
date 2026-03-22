"""
Orchestrates creation of group projects, memberships and group tasks.
"""

import random
import re
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.db.models.signals import post_save
from django.utils import timezone

from studyFlax.models.tasks.task_model import Task
from studyFlax.models.groupwork.groupwork_model import GroupProject, GroupMembership
from studyFlax.models.modules.enrollment_model import Enrollment
from studyFlax.fixtures.groupwork_fixtures import GROUP_TASK_TEMPLATES

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
    return next((student for student in students if student.username == PROJECT_SHOWCASE_USERNAME), None)

def _get_deadline_offset(index):
    return PROJECT_DEADLINE_OFFSETS[index % len(PROJECT_DEADLINE_OFFSETS)]

def _build_project_defaults(owner, module, now, index, source_deadline=None):
    due = _resolve_project_deadline(now, index, source_deadline)
    course_code = module.module_code if module else ""
    return {'owner': owner, 'course_code': course_code, 'deadline': due}

def _dedupe_users(users):
    seen = set()
    unique_users = []
    for user in users:
        if not user or user.id in seen:
            continue
        seen.add(user.id)
        unique_users.append(user)
    return unique_users

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
    modules = []
    for module_list in student_modules.values():
        for module in module_list:
            if module.module_code in seen:
                continue
            seen.add(module.module_code)
            modules.append(module)
    return modules

def _pick_owner_for_module(module, students, module_students, rng):
    eligible_students = [student for student in students if not _has_reached_project_limit(student)]
    if not eligible_students:
        return None
    if module:
        module_members = [student for student in module_students.get(module.module_code, []) if not _has_reached_project_limit(student)]
        if module_members:
            return rng.choice(module_members)
    return _pick_owner(eligible_students, rng)

def _showcase_modules(showcase_student, student_modules, seed_modules):
    if showcase_student:
        modules = student_modules.get(showcase_student.id, [])
        if modules:
            return modules
    return seed_modules

def _project_target_count(module):
    return 1 + (sum(ord(ch) for ch in module.module_code) % 2)

def _module_project_family(module):
    prefix = module.module_code[:2]
    if prefix in {"CS", "AI", "EE", "GN", "CM"}:
        return "technical"
    if prefix in {"PH", "CH", "LS", "NS", "MD", "NU", "MW", "DE"}:
        return "lab"
    if prefix in {"MA", "AF", "EC"}:
        return "analysis"
    return "default"

def _build_project_name(module, label):
    return _normalise_spacing(label)

def _normalise_spacing(value):
    return re.sub(r"\s+", " ", str(value or "").strip(" :-")).strip()

def _strip_module_prefix(module, label):
    clean = _normalise_spacing(label)
    if not clean:
        return ""
    code = _normalise_spacing(module.module_code)
    name = _normalise_spacing(module.module_name)
    prefixes = [prefix for prefix in (f"{code}:", f"{name}:", code, name) if prefix]
    lowered = clean.lower()
    for prefix in prefixes:
        prefix_lower = prefix.lower()
        if lowered.startswith(prefix_lower):
            clean = _normalise_spacing(clean[len(prefix):])
            lowered = clean.lower()
    return clean

def _module_topic_label(module):
    words = [word for word in re.split(r"[^A-Za-z0-9]+", module.module_name or "") if word]
    ignored = {"and", "the", "of", "to", "for", "advanced", "topics", "introduction", "environment"}
    topic_words = [word for word in words if word.lower() not in ignored]
    topic = " ".join(topic_words[:2]) if topic_words else module.module_name or module.module_code
    return _normalise_spacing(topic)

def _title_case(value):
    clean = _normalise_spacing(value)
    return clean[:1].upper() + clean[1:] if clean else clean

def _looks_generic_project_title(label):
    normalised = _normalise_spacing(label).lower()
    if not normalised:
        return True
    generic_patterns = (
        r"^(coursework|assignment|presentation|essay|report|poster|seminar|project)\s*\d*$",
        r"^(group\s+)?coursework\s*\d*$",
        r"^problem\s+sheet\s*\d*$",
        r"^lab\s+report(\s+\d+)?$",
        r"^report\s+review$",
        r"^findings\s+deck$",
        r"^research\s+poster$",
        r"^case\s+report\s+review$",
    )
    return any(re.fullmatch(pattern, normalised) for pattern in generic_patterns)

def _looks_generic_subject(subject):
    tokens = [token for token in re.split(r"[^A-Za-z0-9]+", _normalise_spacing(subject).lower()) if token]
    if not tokens:
        return True
    return all(token.isdigit() or token in GENERIC_SUBJECT_WORDS for token in tokens)

def _build_topic_project_name(module, index):
    topic = _module_topic_label(module)
    family = _module_project_family(module)
    templates = PROJECT_TYPE_TEMPLATES.get(family, PROJECT_TYPE_TEMPLATES["default"])
    template = templates[index % len(templates)]
    return _title_case(f"{topic} {template}")

def _derive_collaborative_deadline_name(module, label, index):
    clean = _strip_module_prefix(module, label)
    if not clean or _looks_generic_project_title(clean):
        return _build_topic_project_name(module, index)
    lower = clean.lower()
    replacements = (
        ("essay", "discussion deck"),
        ("case study", "case study workshop"),
        ("presentation", "presentation"),
        ("report", "report review"),
        ("problem sheet", "problem clinic"),
        ("poster", "poster session"),
        ("coursework", "group coursework"),
    )
    for needle, replacement in replacements:
        if needle not in lower:
            continue
        prefix = _normalise_spacing(clean[:lower.index(needle)])
        subject = prefix if prefix and not _looks_generic_subject(prefix) else _module_topic_label(module)
        return _title_case(f"{subject} {replacement}")
    if len(clean.split()) <= 2:
        subject = clean if not _looks_generic_subject(clean) else _module_topic_label(module)
        return _title_case(f"{subject} workshop")
    return _title_case(clean)

def _project_fallback_names(module):
    return [_build_topic_project_name(module, index) for index in range(_project_target_count(module) + 1)]

def _project_deadline_candidates(module, now):
    candidates = []
    for deadline in module.deadlines.order_by("start_due_date"):
        if deadline.deadline_type not in {"coursework", "presentation"}:
            continue
        days = (deadline.start_due_date.date() - now.date()).days
        candidates.append((0 if 1 <= days <= 20 else 1, deadline, _derive_collaborative_deadline_name(module, deadline.title, len(candidates))))
    return [(deadline, name) for _, deadline, name in sorted(candidates, key=lambda item: (item[0], item[1].start_due_date))]

def _build_module_project_specs(module, now):
    specs = []
    target_count = _project_target_count(module)
    for deadline, name in _project_deadline_candidates(module, now)[:target_count]:
        specs.append({"name": name, "module": module, "source_deadline": deadline})
    fallback_names = _project_fallback_names(module)
    fallback_index = 0
    while len(specs) < target_count:
        fallback_name = fallback_names[fallback_index % len(fallback_names)]
        if not any(spec["name"] == fallback_name for spec in specs):
            specs.append({"name": fallback_name, "module": module, "source_deadline": None})
        fallback_index += 1
    return specs

def _resolve_project_deadline(now, index, source_deadline=None):
    fallback_due = (now + timedelta(days=_get_deadline_offset(index))).replace(hour=23, minute=59, second=0, microsecond=0)
    if source_deadline:
        days = (source_deadline.start_due_date.date() - now.date()).days
        if 1 <= days <= 20:
            if days <= 7 and index >= URGENT_PROJECT_LIMIT:
                return fallback_due
            return source_deadline.start_due_date
    return fallback_due

def _sync_project_owner_membership(project, owner):
    GroupMembership.objects.filter(project=project, role='owner').exclude(user=owner).update(role='member')
    GroupMembership.objects.update_or_create(project=project, user=owner, defaults={'role': 'owner'})


def _has_reached_project_limit(student):
    return GroupMembership.objects.filter(user=student).count() >= MAX_PROJECTS_PER_STUDENT

def _create_single_project(spec, students, now, rng, index, module_students):
    module = spec["module"]
    owner = _pick_owner_for_module(module, students, module_students, rng)
    if not owner:
        return
    defaults = _build_project_defaults(owner, module, now, index, source_deadline=spec.get("source_deadline"))
    project, created = GroupProject.objects.get_or_create(name=spec["name"], course_code=defaults["course_code"], defaults=defaults)
    if not created:
        for field, value in defaults.items():
            setattr(project, field, value)
        project.save(update_fields=list(defaults.keys()))
    _sync_project_owner_membership(project, owner)

def _build_project_specs(showcase_student, student_modules, seed_modules, now):
    # Use all modules from all students so every user gets projects seeded
    specs = []
    for module in seed_modules:
        specs.extend(_build_module_project_specs(module, now))
    return _uniquify_project_spec_names(specs)

def _uniquify_project_spec_names(specs):
    counts = {}
    used_names = set()
    for spec in specs:
        name = spec["name"]
        counts[name] = counts.get(name, 0) + 1
    for index, spec in enumerate(specs):
        original_name = spec["name"]
        if counts.get(original_name, 0) <= 1 and original_name not in used_names:
            used_names.add(original_name)
            continue
        candidate = _build_topic_project_name(spec["module"], index)
        variant_index = 1
        max_template_variants = 30
        while candidate in used_names:
            if variant_index > max_template_variants:
                # Fall back to numeric suffix to guarantee uniqueness
                base = _build_topic_project_name(spec["module"], index)
                candidate = f"{base} {variant_index - max_template_variants}"
            else:
                candidate = _build_topic_project_name(spec["module"], index + variant_index)
            variant_index += 1
        spec["name"] = candidate
        used_names.add(candidate)
    return specs

def _build_seed_project_context(now=None):
    reference_now = now or timezone.now()
    students = _get_student_pool()
    showcase_student = _get_showcase_student(students)
    student_modules, module_students = _build_enrollment_maps(students)
    seed_modules = _list_seed_modules(student_modules)
    specs = _build_project_specs(showcase_student, student_modules, seed_modules, reference_now)
    allowed_keys = {(spec["name"], spec["module"].module_code) for spec in specs}
    allowed_codes = [module.module_code for module in seed_modules]
    projects = [
        project
        for project in GroupProject.objects.filter(course_code__in=allowed_codes)
        if (project.name, project.course_code) in allowed_keys
    ]
    return {
        "students": students,
        "showcase_student": showcase_student,
        "student_modules": student_modules,
        "module_students": module_students,
        "seed_modules": seed_modules,
        "allowed_keys": allowed_keys,
        "projects": projects,
    }

def create_group_projects(stdout):
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

def _fixture_seed_users(students):
    usernames = set(FIXTURE_USERNAMES)
    return [student for student in students if student.username in usernames]

def _ensure_fixture_users_own_projects(student_modules, rng):
    context = _build_seed_project_context(timezone.now())
    projects = list(context["projects"])
    students = context["students"]
    targets = _fixture_seed_users(students)
    if not projects or not targets:
        return
    target_module_codes = _student_module_codes(student_modules)
    ownership_counts = {student.id: 0 for student in targets}
    for project in projects:
        if project.owner_id in ownership_counts:
            ownership_counts[project.owner_id] += 1
    for student in targets:
        while ownership_counts.get(student.id, 0) < FIXTURE_OWNER_MIN_PROJECTS:
            candidate = _pick_project_for_fixture_owner(student, projects, target_module_codes, ownership_counts, rng)
            if not candidate:
                break
            previous_owner_id = candidate.owner_id
            candidate.owner = student
            candidate.save(update_fields=["owner"])
            _sync_project_owner_membership(candidate, student)
            ownership_counts[student.id] = ownership_counts.get(student.id, 0) + 1
            if previous_owner_id in ownership_counts:
                ownership_counts[previous_owner_id] = max(ownership_counts.get(previous_owner_id, 1) - 1, 0)

def _pick_project_for_fixture_owner(student, projects, target_module_codes, ownership_counts, rng):
    module_codes = target_module_codes.get(student.id, set())
    candidates = []
    for project in projects:
        if project.owner_id == student.id:
            continue
        owner_username = getattr(project.owner, "username", "")
        owner_is_fixture = owner_username in FIXTURE_USERNAMES
        owner_has_spare = ownership_counts.get(project.owner_id, 0) > FIXTURE_OWNER_MIN_PROJECTS
        if owner_is_fixture and not owner_has_spare:
            continue
        candidates.append((
            (
                0 if project.course_code in module_codes else 1,
                0 if not owner_is_fixture else 1,
                ownership_counts.get(project.owner_id, 0),
                rng.random(),
            ),
            project,
        ))
    if not candidates:
        return None
    candidates.sort(key=lambda item: item[0])
    return candidates[0][1]

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

def _ordered_member_candidates(project, students, module_students, membership_counts, rng, allow_over_limit=False):
    cohort = _select_project_cohort(project, students, module_students)
    cohort_ids = {student.id for student in cohort}
    ranked = []
    for student in _dedupe_users(cohort + students):
        if student == project.owner:
            continue
        current_count = membership_counts.get(student.id, 0)
        if not allow_over_limit and current_count >= MAX_PROJECTS_PER_STUDENT:
            continue
        ranked.append((
            (
                0 if current_count < MIN_PROJECTS_PER_STUDENT else 1,
                0 if student.id in cohort_ids else 1,
                0 if current_count < MAX_PROJECTS_PER_STUDENT else 1,
                current_count,
                rng.random(),
            ),
            student,
        ))
    ranked.sort(key=lambda item: item[0])
    return [student for _, student in ranked]

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

def _ordered_top_up_projects(student, projects, member_sets, module_codes, rng):
    ranked = []
    student_module_codes = module_codes.get(student.id, set())
    for project in projects:
        members = member_sets.get(project.id, set())
        if student.id in members or len(members) >= MAX_PROJECT_MEMBER_TOTAL:
            continue
        ranked.append((
            (
                0 if project.course_code in student_module_codes else 1,
                len(members),
                rng.random(),
            ),
            project,
        ))
    ranked.sort(key=lambda item: item[0])
    return [project for _, project in ranked]

def _top_up_students_to_minimum(projects, students, student_modules, membership_counts, rng):
    module_codes = _student_module_codes(student_modules)
    member_sets = _project_member_sets(projects)
    made_progress = True
    while made_progress:
        made_progress = False
        under_assigned = [
            student for student in students
            if membership_counts.get(student.id, 0) < MIN_PROJECTS_PER_STUDENT
        ]
        under_assigned.sort(key=lambda student: (membership_counts.get(student.id, 0), student.username))
        for student in under_assigned:
            candidate_projects = _ordered_top_up_projects(student, projects, member_sets, module_codes, rng)
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

def _ensure_projects_have_minimum_members(projects, students, module_students, membership_counts, rng):
    member_sets = _project_member_sets(projects)
    made_progress = True
    while made_progress:
        made_progress = False
        underfilled_projects = sorted(
            [project for project in projects if len(member_sets.get(project.id, set())) < MIN_PROJECT_MEMBER_TOTAL],
            key=lambda project: (len(member_sets.get(project.id, set())), project.deadline or timezone.now(), project.name),
        )
        for project in underfilled_projects:
            needed = MIN_PROJECT_MEMBER_TOTAL - len(member_sets.get(project.id, set()))
            if needed <= 0:
                continue
            for member in _ordered_member_candidates(project, students, module_students, membership_counts, rng):
                if member.id in member_sets.get(project.id, set()):
                    continue
                GroupMembership.objects.update_or_create(
                    project=project,
                    user=member,
                    defaults={"role": "member"},
                )
                member_sets.setdefault(project.id, set()).add(member.id)
                membership_counts[member.id] = membership_counts.get(member.id, 0) + 1
                needed -= 1
                made_progress = True
                if needed <= 0:
                    break

def _ensure_projects_have_teammates(projects, students, module_students, membership_counts, rng):
    member_sets = _project_member_sets(projects)
    solo_projects = sorted(
        [project for project in projects if len(member_sets.get(project.id, set())) < 2],
        key=lambda project: (len(member_sets.get(project.id, set())), project.deadline or timezone.now(), project.name),
    )
    for project in solo_projects:
        needed = 2 - len(member_sets.get(project.id, set()))
        if needed <= 0:
            continue
        for member in _ordered_member_candidates(
            project,
            students,
            module_students,
            membership_counts,
            rng,
            allow_over_limit=True,
        ):
            if member.id in member_sets.get(project.id, set()):
                continue
            GroupMembership.objects.update_or_create(
                project=project,
                user=member,
                defaults={"role": "member"},
            )
            member_sets.setdefault(project.id, set()).add(member.id)
            membership_counts[member.id] = membership_counts.get(member.id, 0) + 1
            needed -= 1
            if needed <= 0:
                break

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
        for project in projects:
            _add_members_to_project(project, students, rng, showcase_student, module_students, membership_counts)
        _top_up_students_to_minimum(projects, students, student_modules, membership_counts, rng)
        _ensure_projects_have_minimum_members(projects, students, module_students, membership_counts, rng)
        _ensure_projects_have_teammates(projects, students, module_students, membership_counts, rng)
    finally:
        post_save.connect(notify_on_added_to_project, sender=GroupMembership)

def _get_project_status_pattern(project, project_index):
    if project_index < ZERO_PROGRESS_PROJECT_COUNT:
        return PROJECT_TASK_STATUS_PATTERNS[0]
    non_zero_count = max(len(PROJECT_TASK_STATUS_PATTERNS) - 1, 1)
    pattern_index = 1 + (sum(ord(char) for char in f"{project.course_code}:{project.name}") % non_zero_count)
    return PROJECT_TASK_STATUS_PATTERNS[pattern_index]

def _build_completed_fields(status, task_index, now):
    is_completed = (status == 'done')
    completed_at = now - timedelta(days=min(task_index, 4)) if is_completed else None
    return is_completed, completed_at

def _build_task_due_date(due, task_index, now):
    lead_days = max(0, min(task_index + 1, max((due.date() - now.date()).days, 0)))
    return due - timedelta(days=lead_days)

def _create_single_group_task(project, members, due, template, task_index, now, rng, status_pattern):
    t_title, t_desc, t_priority, t_blocks = template
    status = status_pattern[task_index % len(status_pattern)]
    is_completed, completed_at = _build_completed_fields(status, task_index, now)
    has_due_date = not (status == "todo" and task_index >= 3)
    task_due = _build_task_due_date(due, task_index, now) if has_due_date else None
    task, _ = Task.objects.update_or_create(
        group_project=project,
        title=t_title,
        defaults={
            'user': project.owner,
            'description': t_desc,
            'priority': t_priority,
            'estimated_blocks': t_blocks,
            'status': status,
            'completed': is_completed,
            'completed_at': completed_at,
            'due_date': task_due,
        },
    )
    primary = members[task_index % len(members)]
    if len(members) > 1 and task_index % 2 == 0:
        secondary = members[(task_index + 1) % len(members)]
        assignees = [primary, secondary]
    else:
        assignees = [primary]
    task.assigned_to.set(assignees)

def _seed_tasks_for_project(project, now, project_index):
    members = sorted([m.user for m in project.memberships.all()], key=lambda u: u.username)
    if not members:
        return
    due = project.deadline or (now + timedelta(days=14))
    rng = random.Random(f"{PROJECT_TASK_SEED}:{project.name}")
    status_pattern = _get_project_status_pattern(project, project_index)
    for task_index, template in enumerate(GROUP_TASK_TEMPLATES):
        _create_single_group_task(project, members, due, template, task_index, now, rng, status_pattern)

def create_group_tasks(stdout):
    stdout.write("Seeding group tasks with assignments and statuses...")
    now = timezone.now()
    context = _build_seed_project_context(now)
    projects = sorted(context["projects"], key=lambda project: (project.course_code, project.name))
    for project_index, project in enumerate(projects):
        _seed_tasks_for_project(project, now, project_index)

def _seed_busy_events_for_member(member, project_id, now):
    from studyFlax.models.calendar.calendar_event_model import CalendarEvent
    member_rng = random.Random(f"avail-busy-{project_id}-{member.username}")
    num_busy = member_rng.randint(2, 4)
    hours_pool = [9, 10, 11, 12, 13, 14, 15, 16, 17]
    for i in range(num_busy):
        day_offset = member_rng.randint(0, 6)
        hour = member_rng.choice(hours_pool)
        start = (now + timedelta(days=day_offset)).replace(hour=hour, minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=1 if member_rng.random() < 0.75 else 2)
        CalendarEvent.objects.get_or_create(
            user=member,
            title="Busy",
            start_time=start,
            defaults={"end_time": end, "source": "seed_availability"},
        )

def _seed_meeting_responses_for_suggestion(suggestion, members, suggestion_index):
    from studyFlax.models.groupwork.groupwork_model import MeetingResponse
    pattern = SEEDED_RESPONSE_PATTERNS[suggestion_index % len(SEEDED_RESPONSE_PATTERNS)]
    for member_index, member in enumerate(members):
        status = pattern[member_index % len(pattern)]
        if suggestion_index == 0 or member == suggestion.suggested_by:
            status = "accepted"
        MeetingResponse.objects.update_or_create(
            suggestion=suggestion,
            user=member,
            defaults={"status": status},
        )

def _seed_meeting_suggestions_for_project(project, members, now):
    from studyFlax.models.groupwork.groupwork_model import MeetingSuggestion

    if not members:
        return
    suggestion_rng = random.Random(f"suggestions-{project.id}-{project.name}")
    windows = list(SEEDED_SUGGESTION_WINDOWS)
    suggestion_rng.shuffle(windows)
    selected_windows = sorted(windows[:SEEDED_SUGGESTION_COUNT], key=lambda item: (item[0], item[1]))
    suggesters = [member for member in members if member != project.owner] or members

    for idx, (day_offset, hour) in enumerate(selected_windows):
        suggester = suggesters[idx % len(suggesters)]
        start = (now + timedelta(days=day_offset)).replace(hour=hour, minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=1)
        suggestion, _ = MeetingSuggestion.objects.update_or_create(
            project=project,
            suggested_by=suggester,
            start_time=start,
            defaults={"end_time": end},
        )
        _seed_meeting_responses_for_suggestion(suggestion, members, idx)

def seed_group_availability(stdout):
    stdout.write("Seeding group availability data (busy events + meeting suggestions)...")
    now = timezone.now()
    context = _build_seed_project_context(now)
    for project in context["projects"]:
        members = [m.user for m in project.memberships.select_related("user").all()]
        if len(members) < 2:
            continue
        for member in members:
            _seed_busy_events_for_member(member, project.id, now)
        _seed_meeting_suggestions_for_project(project, members, now)
    stdout.write("Done seeding group availability.")
