"""
Orchestrates creation of modules, enrolments and deadlines.
"""

from collections import defaultdict

from django.contrib.auth import get_user_model

from studyFlax.models import (
    Module, Enrollment, Deadline, RecurrenceRule, UserSettings,
)
from studyFlax.fixtures.data_fixtures import (
    module_fixtures,
    course_to_module_prefixes,
)
from studyFlax.fixtures.user_fixtures import module_prefix_to_department
from .seed_helpers import (
    PRIOR_UNIVERSITIES,
    PHD_UNIVERSITIES,
    build_settings_for_new_users,
    build_users_list,
)
from .seed_event_helpers import (
    build_module_event, get_user_modules, build_lecture_events,
    create_lecture_event, build_deadlines_for_module,
    create_deadline_calendar_event,
)

User = get_user_model()

FIXED_TEACHER_DEPARTMENTS = {
    "amiller": {"Arts & Humanities"},
    "srahwan": {"Nursing, Midwifery & Palliative Care"},
    "hpatel": {"Natural, Mathematical & Engineering Sciences"},
}
MAX_MODULES_PER_TEACHER = 5

def _register_course_prefixes(mapping, course, prefixes):
    for prefix in prefixes:
        mapping.setdefault(prefix, course)

def _get_prefix_course_map():
    mapping = {}
    for course, prefixes in course_to_module_prefixes.items():
        _register_course_prefixes(mapping, course, prefixes)
    return mapping

PREFIX_TO_COURSE = _get_prefix_course_map()

def _get_module_prefix(module_code):
    end = next((i for i, ch in enumerate(module_code) if not ch.isalpha()), len(module_code))
    return module_code[:end] or module_code[:2]

def _build_module_metadata(module_code):
    prefix = _get_module_prefix(module_code)
    department = module_prefix_to_department.get(prefix, "")
    course = PREFIX_TO_COURSE.get(prefix, "")
    return department, course

def _fixed_departments(username):
    return FIXED_TEACHER_DEPARTMENTS.get(username, set())

def _append_departments(department_to_pool, teacher, departments):
    for department in departments:
        department_to_pool[department].append(teacher)

def _unassigned_teachers(teachers):
    return [t for t in teachers if t.username not in FIXED_TEACHER_DEPARTMENTS]

def _assign_unassigned_teachers(department_to_pool, teachers, departments):
    ordered = sorted(teachers, key=lambda teacher: teacher.username)
    for index, teacher in enumerate(ordered):
        department_to_pool[departments[index % len(departments)]].append(teacher)

def _department_pool(teachers):
    department_to_pool = defaultdict(list)
    for teacher in teachers:
        _append_departments(department_to_pool, teacher, _fixed_departments(teacher.username))
    if not teachers:
        return department_to_pool
    departments = sorted(set(module_prefix_to_department.values()))
    _assign_unassigned_teachers(department_to_pool, _unassigned_teachers(teachers), departments)
    return department_to_pool

def _required_teachers(module_count):
    return max(1, (module_count + MAX_MODULES_PER_TEACHER - 1) // MAX_MODULES_PER_TEACHER)

def _build_specs(entries):
    return [(code, name, description, *_build_module_metadata(code)) for code, name, description in entries]

def _group_specs_by_department(specs):
    grouped = defaultdict(list)
    for spec in specs:
        grouped[spec[3]].append(spec)
    return grouped

def _create_department_teachers(department, needed):
    new_users = build_users_list(needed, role='teacher')
    User.objects.bulk_create(new_users, ignore_conflicts=True)
    UserSettings.objects.bulk_create(build_settings_for_new_users())
    usernames = [u.username for u in new_users]
    teachers = list(User.objects.filter(username__in=usernames))
    UserSettings.objects.filter(user__in=teachers).update(major=department)
    return teachers

def _capacity_gap(current_count, module_count):
    return max(0, _required_teachers(module_count) - current_count)

def _grow_department_capacity(department_to_pool, department, specs):
    gap = _capacity_gap(len(department_to_pool.get(department, [])), len(specs))
    extras = _create_department_teachers(department, gap) if gap else []
    department_to_pool[department].extend(extras)

def _ensure_department_capacity(department_to_pool, grouped_specs):
    for department, specs in grouped_specs.items():
        _grow_department_capacity(department_to_pool, department, specs)

def _pick_with_capacity(department_to_pool, cursor, department, load):
    candidates = [t for t in department_to_pool.get(department, []) if load[t.id] < MAX_MODULES_PER_TEACHER]
    if not candidates:
        return None
    index = cursor[department] % len(candidates)
    cursor[department] += 1
    return candidates[index]

def _department_focus(department):
    themes = {
        "Arts & Humanities": "languages, literature, and cultural analysis",
        "Business": "strategy, leadership, and real-world commercial decision-making",
        "Law": "legal reasoning, case analysis, and policy interpretation",
        "Social Science & Public Policy": "policy design, political institutions, and evidence-led evaluation",
        "Natural, Mathematical & Engineering Sciences": "quantitative methods, modelling, and technical problem-solving",
        "Life Sciences & Medicine": "clinical reasoning, biomedical systems, and translational research",
        "Nursing, Midwifery & Palliative Care": "patient-centred care, clinical communication, and evidence-based practice",
        "Psychiatry, Psychology & Neuroscience": "behaviour, cognition, and brain science in applied contexts",
        "Dentistry, Oral & Craniofacial Sciences": "oral health, anatomy, and modern clinical techniques",
    }
    return themes.get(department, "student success through engaging, practical teaching")

def _stable_index(text, size):
    return sum(ord(ch) for ch in text) % size

def _teacher_universities(user):
    phd_index = _stable_index(user.username + user.last_name, len(PHD_UNIVERSITIES))
    phd_uni = PHD_UNIVERSITIES[phd_index]
    prior_seed = user.first_name + user.username[::-1]
    prior_uni = PRIOR_UNIVERSITIES[_stable_index(prior_seed, len(PRIOR_UNIVERSITIES))]
    if prior_uni == phd_uni:
        prior_uni = PRIOR_UNIVERSITIES[(PRIOR_UNIVERSITIES.index(prior_uni) + 1) % len(PRIOR_UNIVERSITIES)]
    return phd_uni, prior_uni

def _department_bio(user, department):
    focus = _department_focus(department)
    phd_uni, prior_uni = _teacher_universities(user)
    return (
        f"Dr. {user.first_name} {user.last_name} specialises in {focus}. "
        f"They completed their PhD at {phd_uni} after earlier study at {prior_uni}. "
        f"Based in {department}, they are known for energetic, discussion-rich teaching, "
        "combining academic rigour with practical, career-ready skills and clear feedback students can use immediately."
    )

def _ensure_department_coverage(department_to_pool, teachers):
    if not teachers:
        return
    all_departments = sorted(set(module_prefix_to_department.values()))
    missing = [dep for dep in all_departments if not department_to_pool.get(dep)]
    for index, department in enumerate(missing):
        department_to_pool[department].append(teachers[index % len(teachers)])

def _sync_teacher_departments():
    teachers = list(User.objects.filter(role='teacher').only('id', 'first_name', 'last_name', 'bio'))
    for teacher in teachers:
        settings, _ = UserSettings.objects.get_or_create(user=teacher)
        taught = list(Module.objects.filter(created_by=teacher).values_list('department', flat=True))
        taught = [d for d in taught if d]
        department = max(set(taught), key=taught.count) if taught else ''
        settings.major = department
        settings.save(update_fields=['major'])
        teacher.bio = _department_bio(teacher, department or "their faculty")
        teacher.save(update_fields=['bio'])

def _build_single_extra(prefix, base_number, extra_name, existing_codes):
    code = f"{prefix}{base_number}"
    if code in existing_codes:
        return None
    name = f"{extra_name} in {prefix}"
    description = (
        f"Extended {prefix} module focused on advanced concepts, applied methods, "
        "and real-world case work."
    )
    return (code, name, description)

def _build_extra_module_entries(prefix, existing_codes, target_count=8):
    base_numbers = [4606, 4707, 4808]
    extra_names = ["Advanced Topics", "Applied Practice", "Research Project"]
    limit = min(target_count, len(base_numbers))
    entries = [_build_single_extra(prefix, base_numbers[i], extra_names[i], existing_codes) for i in range(limit)]
    return [e for e in entries if e is not None]

def _expand_prefix_group(prefix, entries, target_count):
    expanded = list(entries)
    if len(entries) >= target_count:
        return expanded
    existing_codes = {code for code, _, _ in entries}
    needed = target_count - len(entries)
    expanded.extend(_build_extra_module_entries(prefix, existing_codes, target_count=needed))
    return expanded

def _build_modules_with_target_per_prefix(fixtures, target_count=8):
    grouped = defaultdict(list)
    for code, name, description in fixtures:
        grouped[_get_module_prefix(code)].append((code, name, description))
    expanded = []
    for prefix, entries in grouped.items():
        expanded.extend(_expand_prefix_group(prefix, entries, target_count))
    return expanded

def _module_payload(code, name, description, teacher, weekly_rule, department, course):
    payload = build_module_event(code, name, description, teacher, weekly_rule)
    payload.update({'department': department, 'course': course})
    return payload

def _create_module(code, name, description, teacher, weekly_rule, department, course):
    payload = _module_payload(code, name, description, teacher, weekly_rule, department, course)
    Module.objects.update_or_create(module_code=code, defaults=payload)

def _base_teachers():
    teachers = list(User.objects.filter(role='teacher'))
    if teachers:
        return teachers
    fallback = User.objects.filter(is_superuser=True).first()
    if fallback:
        return [fallback]
    return list(User.objects.filter(is_staff=False)[:1])

def _weekly_rule():
    return RecurrenceRule.objects.filter(frequency='weekly', interval=1).first()

def _module_specs():
    entries = _build_modules_with_target_per_prefix(module_fixtures, target_count=5)
    return _build_specs(entries)

def _ensure_teacher_for_department(pool, cursor, load, department):
    teacher = _pick_with_capacity(pool, cursor, department, load)
    if teacher:
        return teacher
    pool[department].extend(_create_department_teachers(department, 1))
    return _pick_with_capacity(pool, cursor, department, load)

def _teacher_for_spec(spec, pool, cursor, load, stdout):
    code, _, _, department, _ = spec
    teacher = _ensure_teacher_for_department(pool, cursor, load, department)
    if teacher:
        return teacher
    stdout.write(f"  No teacher capacity for {department}, skipping {code}.")
    return None

def _seed_single_spec(spec, department_to_pool, weekly_rule, stdout, teacher_load, department_cursor):
    code, name, description, department, course = spec
    teacher = _teacher_for_spec(spec, department_to_pool, department_cursor, teacher_load, stdout)
    if not teacher:
        return
    _create_module(code, name, description, teacher, weekly_rule, department, course)
    teacher_load[teacher.id] += 1

def _seed_modules_by_specs(specs, department_to_pool, weekly_rule, stdout):
    teacher_load = defaultdict(int)
    department_cursor = defaultdict(int)
    for spec in specs:
        _seed_single_spec(spec, department_to_pool, weekly_rule, stdout, teacher_load, department_cursor)

def create_modules(stdout):
    stdout.write("Seeding modules...")
    teachers = _base_teachers()
    if not teachers:
        stdout.write("  No teachers available, skipping module creation.")
        return
    pool = _department_pool(teachers)
    _ensure_department_coverage(pool, teachers)
    specs = _module_specs()
    _ensure_department_capacity(pool, _group_specs_by_department(specs))
    _seed_modules_by_specs(specs, pool, _weekly_rule(), stdout)
    _sync_teacher_departments()

def create_deadlines(modules, stdout):
    stdout.write("Seeding deadlines...")
    deadlines_to_create = []
    for module in modules:
        deadlines_to_create.extend(build_deadlines_for_module(module))
    Deadline.objects.bulk_create(deadlines_to_create, ignore_conflicts=True)
    stdout.write(f"  Created {len(deadlines_to_create)} deadlines.")

def _should_enroll(user, module):
    return not Enrollment.objects.filter(student=user, module=module).exists()

def _enroll_if_needed(user, module, enrollments):
    if _should_enroll(user, module):
        enrollments.append(Enrollment(student=user, module=module))

def _process_module(user, module, lecture_tag, enrollments):
    _enroll_if_needed(user, module, enrollments)
    for u, mod, start, end, tag in build_lecture_events(user, module, lecture_tag):
        create_lecture_event(u, mod, start, end, tag)
    for deadline in module.deadlines.all():
        create_deadline_calendar_event(user, deadline)

def _process_user_modules(user, modules, lecture_tag, enrollments):
    core, extras = get_user_modules(user, modules)
    for module in core:
        _process_module(user, module, lecture_tag, enrollments)
    for module in extras:
        _process_module(user, module, lecture_tag, enrollments)

def _lecture_tag_for_user(user, tags):
    return next((t for t in tags if t.name == 'Lecture' and (t.user_id == user.id or t.is_default)), None)

def create_enrollments(modules, tags, stdout):
    stdout.write("Seeding enrollments and lecture events...")
    enrollments = []
    for user in User.objects.all().select_related('settings'):
        lecture_tag = _lecture_tag_for_user(user, tags)
        _process_user_modules(user, modules, lecture_tag, enrollments)
    Enrollment.objects.bulk_create(enrollments, ignore_conflicts=True)
    stdout.write(f"  Created {len(enrollments)} enrollments.")
