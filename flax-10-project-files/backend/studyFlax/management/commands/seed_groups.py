"""
Orchestrates creation of group projects, memberships and group tasks.
"""

import random
import re
from datetime import timedelta

from django.contrib.auth import get_user_model
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
PROJECT_DEADLINE_OFFSETS = (2, 5, 7, 10, 12, 15, 17, 19)
URGENT_PROJECT_LIMIT = 3
MIN_PROJECT_MEMBER_TOTAL = 4
MAX_PROJECT_MEMBER_TOTAL = 10
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

def _get_student_pool():
    return list(
        User.objects.filter(role='student')
        .exclude(username='johndoe')
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
    if module:
        module_members = module_students.get(module.module_code, [])
        if module_members:
            return rng.choice(module_members)
    return _pick_owner(students, rng)

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
    modules = _showcase_modules(showcase_student, student_modules, seed_modules)
    specs = []
    for module in modules:
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
        while candidate in used_names:
            candidate = _build_topic_project_name(spec["module"], index + variant_index)
            variant_index += 1
        spec["name"] = candidate
        used_names.add(candidate)
    return specs

def create_group_projects(stdout):
    stdout.write("Seeding group projects...")
    now = timezone.now()
    rng = random.Random(PROJECT_OWNER_SEED)
    students = _get_student_pool()
    showcase_student = _get_showcase_student(students)
    student_modules, module_students = _build_enrollment_maps(students)
    seed_modules = _list_seed_modules(student_modules)
    specs = _build_project_specs(showcase_student, student_modules, seed_modules, now)
    for index, spec in enumerate(specs):
        _create_single_project(spec, students, now, rng, index, module_students)

def _select_project_cohort(project, students, module_students):
    cohort = _dedupe_users(module_students.get(project.course_code, []))
    if len(cohort) >= MIN_PROJECT_MEMBER_TOTAL:
        return cohort
    fallback_students = [student for student in students if student.id not in {member.id for member in cohort}]
    return _dedupe_users(cohort + fallback_students)

def _add_members_to_project(project, students, rng, showcase_student, module_students):
    cohort = _select_project_cohort(project, students, module_students)
    potential = [student for student in cohort if student != project.owner]
    forced_members = []
    if showcase_student and showcase_student != project.owner and any(student.id == showcase_student.id for student in potential):
        forced_members.append(showcase_student)
    max_total = min(MAX_PROJECT_MEMBER_TOTAL, 1 + len(potential))
    if max_total <= 1:
        target_total = 1
    elif max_total < MIN_PROJECT_MEMBER_TOTAL:
        target_total = max_total
    else:
        requested_total = rng.randint(MIN_PROJECT_MEMBER_TOTAL, MAX_PROJECT_MEMBER_TOTAL)
        target_total = min(requested_total, max_total)
    member_target = max(target_total - 1, 0)
    remaining_pool = [student for student in potential if student.id not in {member.id for member in forced_members}]
    sampled_members = rng.sample(remaining_pool, min(len(remaining_pool), max(0, member_target - len(forced_members)))) if remaining_pool else []
    members = _dedupe_users(forced_members + sampled_members)
    selected_ids = {member.id for member in members}
    GroupMembership.objects.filter(project=project).exclude(user=project.owner).exclude(user_id__in=selected_ids).delete()
    for m in members:
        GroupMembership.objects.update_or_create(project=project, user=m, defaults={'role': 'member'})

def create_group_memberships(stdout):
    stdout.write("Seeding group memberships...")
    rng = random.Random(PROJECT_MEMBER_SEED)
    students = _get_student_pool()
    showcase_student = _get_showcase_student(students)
    student_modules, module_students = _build_enrollment_maps(students)
    seed_modules = _list_seed_modules(student_modules)
    allowed_specs = _build_project_specs(showcase_student, student_modules, seed_modules, timezone.now())
    allowed_keys = {(spec["name"], spec["module"].module_code) for spec in allowed_specs}
    projects = list(GroupProject.objects.filter(course_code__in=[module.module_code for module in _showcase_modules(showcase_student, student_modules, seed_modules)]))
    for project in projects:
        if (project.name, project.course_code) not in allowed_keys:
            continue
        _add_members_to_project(project, students, rng, showcase_student, module_students)

def _get_project_status_pattern(project):
    pattern_index = sum(ord(char) for char in f"{project.course_code}:{project.name}") % len(PROJECT_TASK_STATUS_PATTERNS)
    return PROJECT_TASK_STATUS_PATTERNS[pattern_index]

def _build_completed_fields(status, task_index, now):
    is_completed = (status == 'done')
    completed_at = now - timedelta(days=min(task_index, 4)) if is_completed else None
    return is_completed, completed_at

def _build_task_due_date(due, task_index, now):
    lead_days = max(0, min(task_index + 1, max((due.date() - now.date()).days, 0)))
    return due - timedelta(days=lead_days)

def _create_single_group_task(project, members, due, template, task_index, now, rng):
    t_title, t_desc, t_priority, t_blocks = template
    status = _get_project_status_pattern(project)[task_index % len(GROUP_TASK_TEMPLATES)]
    is_completed, completed_at = _build_completed_fields(status, task_index, now)
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
            'due_date': _build_task_due_date(due, task_index, now),
        },
    )
    selected_count = min(len(members), 1 + ((task_index + len(project.name)) % 2))
    assignees = rng.sample(members, selected_count) if selected_count > 0 else []
    task.assigned_to.set(assignees)

def _seed_tasks_for_project(project, now):
    members = [m.user for m in project.memberships.all()]
    if not members:
        return
    due = project.deadline or (now + timedelta(days=14))
    rng = random.Random(f"{PROJECT_TASK_SEED}:{project.name}")
    for task_index, template in enumerate(GROUP_TASK_TEMPLATES):
        _create_single_group_task(project, members, due, template, task_index, now, rng)

def create_group_tasks(stdout):
    stdout.write("Seeding group tasks with assignments and statuses...")
    now = timezone.now()
    for project in GroupProject.objects.all():
        _seed_tasks_for_project(project, now)
