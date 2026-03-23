"""
Orchestrates creation of modules, enrolments and deadlines.
"""

from collections import defaultdict
from datetime import timedelta

from django.contrib.auth import get_user_model

from studyFlax.models import (
    Module, Enrollment, Deadline, RecurrenceRule, UserSettings,
)
from studyFlax.fixtures.data_fixtures import (
    module_fixtures,
    course_to_module_prefixes,
)
from studyFlax.fixtures.user_fixtures import module_prefix_to_department
from ..helpers import (
    PRIOR_UNIVERSITIES,
    PHD_UNIVERSITIES,
    build_settings_for_new_users,
    build_users_list,
)
from django.db import transaction
from django.utils import timezone

from studyFlax.models import CalendarEvent
from ..events.event_helpers import (
    build_module_event, get_user_modules, build_deadlines_for_module,
    build_deadline_event,
)
from ..events.session_events import (
    build_module_sessions, build_session_event, session_tag,
)

User = get_user_model()

FIXED_TEACHER_DEPARTMENTS = {
    "amiller": {"Arts & Humanities"},
}
MAX_MODULES_PER_TEACHER = 5
MAX_FIXED_EVENT_OVERLAPS = 2
FIXED_EVENT_DAY_START_HOUR = 8
FIXED_EVENT_DAY_END_HOUR = 20
FIXED_EVENT_SLOT_STEP_MINUTES = 30

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
    teachers = _base_teachers()
    if not teachers:
        return
    pool = _department_pool(teachers)
    _ensure_department_coverage(pool, teachers)
    specs = _module_specs()
    _ensure_department_capacity(pool, _group_specs_by_department(specs))
    _seed_modules_by_specs(specs, pool, _weekly_rule(), stdout)
    _sync_teacher_departments()

def create_deadlines(modules, stdout):
    deadlines_to_create = []
    for module in modules:
        deadlines_to_create.extend(build_deadlines_for_module(module))
    Deadline.objects.bulk_create(deadlines_to_create, ignore_conflicts=True)

def _should_enroll(user, module):
    return not Enrollment.objects.filter(student=user, module=module).exists()

def _enroll_if_needed(user, module, enrollments):
    if _should_enroll(user, module):
        enrollments.append(Enrollment(student=user, module=module))

def _deadline_tag(deadline, deadline_tag, exam_tag):
    """Return Exam tag for exams, Deadline tag for other types."""

    return exam_tag if deadline.deadline_type == 'exam' else deadline_tag


def _build_user_session_events(user, module, tags, now):
    """Build unsaved session events for a user's module."""

    lecture_tag, _, _, schedule_tag = tags
    events = []
    for session in build_module_sessions(module, now):
        tag = session_tag(session, lecture_tag, schedule_tag)
        events.append(build_session_event(user, session, tag))
    return events


def _build_user_deadline_events(user, module, tags, deadlines_by_module):
    """Build unsaved deadline events for a user's module."""

    _, deadline_tag, exam_tag, _ = tags
    events = []
    for deadline in deadlines_by_module.get(module.id, []):
        tag = _deadline_tag(deadline, deadline_tag, exam_tag)
        events.append(build_deadline_event(user, deadline, tag))
    return events


def _is_seeded_timetable_event(event):
    return (getattr(event, 'source', '') or '').lower() == 'timetable'


def _is_fixed_seed_event(event):
    source = (getattr(event, 'source', '') or '').lower()
    return source == 'timetable' or source.startswith('module_') or source == 'society'


def _event_day(event):
    return event.start_time.date()


def _event_duration(event):
    duration = event.end_time - event.start_time
    return max(duration, timedelta(minutes=30))


def _event_sort_key(event):
    return (event.start_time, -_event_duration(event).total_seconds(), str(event.title or ''))


def _event_overlap(event, start_time, end_time):
    return event.start_time < end_time and event.end_time > start_time


def _fits_fixed_overlap_cap(start_time, end_time, existing_events):
    points = [(start_time, 1), (end_time, -1)]
    for event in existing_events:
        if not _event_overlap(event, start_time, end_time):
            continue
        points.append((event.start_time, 1))
        points.append((event.end_time, -1))
    active = 0
    for _, delta in sorted(points, key=lambda item: (item[0], 0 if item[1] == -1 else 1)):
        active += delta
        if active > MAX_FIXED_EVENT_OVERLAPS:
            return False
    return True


def _candidate_fixed_slots(event, duration):
    day_start = event.start_time.replace(
        hour=FIXED_EVENT_DAY_START_HOUR,
        minute=0,
        second=0,
        microsecond=0,
    )
    day_end = event.start_time.replace(
        hour=FIXED_EVENT_DAY_END_HOUR,
        minute=0,
        second=0,
        microsecond=0,
    )
    starts = []
    cursor = day_start
    while cursor + duration <= day_end:
        starts.append(cursor)
        cursor += timedelta(minutes=FIXED_EVENT_SLOT_STEP_MINUTES)
    starts.sort(
        key=lambda candidate: (
            abs((candidate - event.start_time).total_seconds()),
            candidate < event.start_time,
            candidate,
        )
    )
    return starts


def _update_timetable_external_id(event, start_time):
    external_id = getattr(event, 'external_id', None)
    if not external_id:
        return
    prefix, separator, _ = str(external_id).rpartition('-')
    if prefix and separator:
        event.external_id = f"{prefix}-{start_time.strftime('%Y%m%dT%H%M')}"


def _rebalance_seeded_fixed_events(events):
    fixed_by_day = defaultdict(list)
    movable_sessions_by_day = defaultdict(list)
    for event in events:
        if _is_seeded_timetable_event(event):
            movable_sessions_by_day[_event_day(event)].append(event)
            continue
        if _is_fixed_seed_event(event):
            fixed_by_day[_event_day(event)].append(event)
    for day, day_sessions in movable_sessions_by_day.items():
        placed = sorted(fixed_by_day.get(day, []), key=_event_sort_key)
        for session in sorted(day_sessions, key=_event_sort_key):
            duration = _event_duration(session)
            start_time = session.start_time
            end_time = session.end_time
            if not _fits_fixed_overlap_cap(start_time, end_time, placed):
                for candidate in _candidate_fixed_slots(session, duration):
                    candidate_end = candidate + duration
                    if not _fits_fixed_overlap_cap(candidate, candidate_end, placed):
                        continue
                    start_time = candidate
                    end_time = candidate_end
                    break
            session.start_time = start_time
            session.end_time = end_time
            _update_timetable_external_id(session, start_time)
            placed.append(session)
    return events


def _process_single_module(user, module, tags, now, deadlines_by_module):
    """Build enrollment and events for a single module."""

    enrollment = Enrollment(student=user, module=module) if _should_enroll(user, module) else None
    session_events = _build_user_session_events(user, module, tags, now)
    deadline_events = _build_user_deadline_events(user, module, tags, deadlines_by_module)
    return enrollment, session_events + deadline_events


def _collect_module_result(enrollment, module_events, enrollments, events):
    """Append enrollment (if any) and events to the accumulators."""

    if enrollment:
        enrollments.append(enrollment)
    events.extend(module_events)


def _build_user_module_events(user, modules, tags, now, deadlines_by_module):
    """Build all events for a user's enrolled modules."""

    core, extras = get_user_modules(user, modules)
    enrollments, events = [], []
    for module in core + extras:
        enrollment, module_events = _process_single_module(user, module, tags, now, deadlines_by_module)
        _collect_module_result(enrollment, module_events, enrollments, events)
    return enrollments, _rebalance_seeded_fixed_events(events)

def _find_user_tag(user, tags, name):
    """Find a tag by name for a user, falling back to default tags."""

    return next((t for t in tags if t.name == name and (t.user_id == user.id or t.is_default)), None)

def _get_user_module_tags(user, tags):
    """Return (lecture_tag, deadline_tag, exam_tag, schedule_tag) for a user."""

    return (
        _find_user_tag(user, tags, 'Lecture'),
        _find_user_tag(user, tags, 'Deadline'),
        _find_user_tag(user, tags, 'Exam'),
        _find_user_tag(user, tags, 'Schedule'),
    )

def _prefetch_deadlines_by_module(modules):
    """Prefetch all deadlines grouped by module ID."""

    from studyFlax.models import Deadline
    deadlines = Deadline.objects.filter(module__in=modules)
    by_module = defaultdict(list)
    for d in deadlines:
        by_module[d.module_id].append(d)
    return by_module


def _collect_all_enrollments_and_events(users, modules, tags, now, deadlines_by_module):
    """Collect enrollments and events for all users."""

    all_enrollments, all_events = [], []
    for user in users:
        user_tags = _get_user_module_tags(user, tags)
        enrollments, events = _build_user_module_events(user, modules, user_tags, now, deadlines_by_module)
        all_enrollments.extend(enrollments)
        all_events.extend(events)
    return all_enrollments, all_events


@transaction.atomic
def create_enrollments(modules, tags, stdout):
    """Create enrollments and all module events for all users."""

    now = timezone.now()
    deadlines_by_module = _prefetch_deadlines_by_module(modules)
    users = list(User.objects.all().select_related('settings'))
    all_enrollments, all_events = _collect_all_enrollments_and_events(users, modules, tags, now, deadlines_by_module)
    Enrollment.objects.bulk_create(all_enrollments, ignore_conflicts=True, batch_size=500)
    CalendarEvent.objects.bulk_create(all_events, ignore_conflicts=True, batch_size=500)
