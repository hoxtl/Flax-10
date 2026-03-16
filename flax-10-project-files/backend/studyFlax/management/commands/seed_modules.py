"""
Orchestrates creation of modules, enrolments and deadlines.
"""

from collections import defaultdict

from django.contrib.auth import get_user_model

from studyFlax.models import (
    Module, Enrollment, Deadline, RecurrenceRule,
)
from studyFlax.fixtures.data_fixtures import module_fixtures
from .seed_event_helpers import (
    build_module_event, get_user_modules, build_lecture_events,
    create_lecture_event, build_deadlines_for_module,
    create_deadline_calendar_event,
)

User = get_user_model()

def _get_module_prefix(module_code):
    end = next((i for i, ch in enumerate(module_code) if not ch.isalpha()), len(module_code))
    return module_code[:end] or module_code[:2]

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

def _create_module(code, name, description, teacher, weekly_rule):
    if not Module.objects.filter(module_code=code).exists():
        Module.objects.create(**build_module_event(code, name, description, teacher, weekly_rule))

def create_modules(stdout):
    stdout.write("Seeding modules...")
    teachers = list(User.objects.filter(role='teacher'))
    if not teachers:
        teachers = [User.objects.filter(is_superuser=True).first()]
    weekly_rule = RecurrenceRule.objects.filter(frequency='weekly', interval=1).first()
    all_entries = _build_modules_with_target_per_prefix(module_fixtures, target_count=5)
    for i, (code, name, description) in enumerate(all_entries):
        _create_module(code, name, description, teachers[i % len(teachers)], weekly_rule)

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

def create_enrollments(modules, tags, stdout):
    stdout.write("Seeding enrollments and lecture events...")
    lecture_tag = next((t for t in tags if t.name == 'Lecture'), None)
    enrollments = []
    for user in User.objects.all().select_related('settings'):
        _process_user_modules(user, modules, lecture_tag, enrollments)
    Enrollment.objects.bulk_create(enrollments, ignore_conflicts=True)
    stdout.write(f"  Created {len(enrollments)} enrollments.")
