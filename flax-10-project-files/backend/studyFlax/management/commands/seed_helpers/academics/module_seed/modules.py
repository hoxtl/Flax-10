"""
Module seeding orchestration.
"""

from collections import defaultdict

from studyFlax.models import Module
from ...calendar.event_helpers import build_module_event
from .enrolments import create_deadlines, create_enrollments
from .metadata import build_module_specs, group_specs_by_department
from .teachers import (
    base_teachers,
    department_pool,
    ensure_department_capacity,
    ensure_department_coverage,
    sync_teacher_departments,
    teacher_for_spec,
    weekly_rule,
)


def _module_payload(code, name, description, teacher, recurrence_rule, department, course):
    payload = build_module_event(code, name, description, teacher, recurrence_rule)
    payload.update({"department": department, "course": course})
    return payload

def _create_module(code, name, description, teacher, recurrence_rule, department, course):
    payload = _module_payload(code, name, description, teacher, recurrence_rule, department, course)
    Module.objects.update_or_create(module_code=code, defaults=payload)

def _seed_single_spec(spec, department_to_pool, recurrence_rule, teacher_load, department_cursor, stdout):
    teacher = teacher_for_spec(spec, department_to_pool, department_cursor, teacher_load, stdout)
    if not teacher:
        return
    code, name, description, department, course = spec
    _create_module(code, name, description, teacher, recurrence_rule, department, course)
    teacher_load[teacher.id] += 1

def _seed_modules_by_specs(specs, department_to_pool, recurrence_rule, stdout):
    teacher_load = defaultdict(int)
    department_cursor = defaultdict(int)
    for spec in specs:
        _seed_single_spec(spec, department_to_pool, recurrence_rule, teacher_load, department_cursor, stdout)

def create_modules(stdout):
    """Create seeded modules and assign them across the teacher pool."""
    teachers = base_teachers()
    if not teachers:
        return
    department_to_pool = department_pool(teachers)
    ensure_department_coverage(department_to_pool, teachers)
    specs = build_module_specs(target_count=5)
    ensure_department_capacity(department_to_pool, group_specs_by_department(specs))
    _seed_modules_by_specs(specs, department_to_pool, weekly_rule(), stdout)
    sync_teacher_departments()


__all__ = ["create_deadlines", "create_enrollments", "create_modules"]
