"""
Orchestrates bulk creation of readings and reading tasks.
"""

from collections import defaultdict

from django.db import transaction

from studyFlax.models import Module, Reading, Enrollment
from studyFlax.models.tasks.task_model import Task, TaskList
from studyFlax.utils.reading_utils import update_reading_estimates
from .reading_helpers import build_readings_for_module, build_reading_tasks_for_user


def _build_all_readings(modules):
    """Build unsaved Reading instances for all modules."""
    readings = []
    for module in modules:
        readings.extend(build_readings_for_module(module))
    return readings

def _prefetch_readings_by_module():
    """Fetch all readings grouped by module ID."""
    readings_by_module = defaultdict(list)
    for reading in Reading.objects.all():
        readings_by_module[reading.module_id].append(reading)
    return readings_by_module

def _prefetch_enrollments_by_student(students):
    """Fetch all enrollments grouped by student ID."""
    enrollments = Enrollment.objects.filter(student__in=students).values_list('student_id', 'module_id')
    by_student = defaultdict(set)
    for student_id, module_id in enrollments:
        by_student[student_id].add(module_id)
    return by_student

def _prefetch_personal_lists(students):
    """Fetch Personal TaskLists grouped by user ID."""
    lists = TaskList.objects.filter(user__in=students, name="Personal")
    return {tl.user_id: tl for tl in lists}

def _extract_module_code(name):
    """Extract module code from TaskList name like 'CS101 - Intro'."""
    return name.split(" - ")[0] if " - " in name else None

def _get_module_id_for_code(code):
    module = Module.objects.filter(module_code=code).first()
    return module.id if module else None

def _resolve_module_id(name):
    """Resolve module ID from TaskList name."""
    code = _extract_module_code(name)
    return _get_module_id_for_code(code) if code else None

def _add_module_list(result, tl):
    """Add a TaskList to result if it maps to a valid module."""
    module_id = _resolve_module_id(tl.name)
    if module_id:
        result[tl.user_id][module_id] = tl

def _prefetch_module_lists(students):
    """Fetch module TaskLists grouped by user_id -> module_id -> TaskList."""
    lists = TaskList.objects.filter(user__in=students, category="uni")
    result = defaultdict(dict)
    for tl in lists:
        _add_module_list(result, tl)
    return result

def _build_student_tasks(student, readings_by_module, enrollments_by_student, personal_lists, module_lists):
    module_ids = enrollments_by_student.get(student.id, set())
    default_list = personal_lists.get(student.id)
    if not default_list:
        return []
    user_module_lists = module_lists.get(student.id, {})
    return build_reading_tasks_for_user(student, module_ids, readings_by_module, user_module_lists, default_list)

def _build_all_reading_tasks(students, readings_by_module, enrollments_by_student, personal_lists, module_lists):
    tasks = []
    for student in students:
        tasks.extend(_build_student_tasks(student, readings_by_module, enrollments_by_student, personal_lists, module_lists))
    return tasks

def _student_has_reading_tasks(student):
    """Check if student has any reading tasks."""
    return Task.objects.filter(user=student, reading__isnull=False).exists()

def _update_student_reading_estimates(student):
    """Update reading estimates for a student if they have reading tasks."""
    if _student_has_reading_tasks(student):
        update_reading_estimates(student)

def _update_all_reading_estimates(students):
    for student in students:
        _update_student_reading_estimates(student)

def _create_module_readings(modules, stdout):
    readings = _build_all_readings(modules)
    Reading.objects.bulk_create(readings, ignore_conflicts=True, batch_size=500)

def _create_reading_tasks(students, stdout):
    readings_by_module = _prefetch_readings_by_module()
    enrollments_by_student = _prefetch_enrollments_by_student(students)
    personal_lists = _prefetch_personal_lists(students)
    module_lists = _prefetch_module_lists(students)
    tasks = _build_all_reading_tasks(students, readings_by_module, enrollments_by_student, personal_lists, module_lists)
    Task.objects.bulk_create(tasks, ignore_conflicts=True, batch_size=500)

@transaction.atomic
def create_readings(modules, students, stdout):
    _create_module_readings(modules, stdout)
    _create_reading_tasks(students, stdout)
    _update_all_reading_estimates(students)
    stdout.write(f"  \u2713  {'Readings':<14} {Reading.objects.count():,}")
