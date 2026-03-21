"""
Orchestrates bulk creation of readings and reading tasks.
"""

from collections import defaultdict

from django.db import transaction

from studyFlax.models import Module, Reading, Enrollment
from studyFlax.models.tasks.task_model import Task, TaskList
from studyFlax.utils.reading_utils import update_reading_estimates
from .seed_reading_helpers import build_readings_for_module, build_reading_tasks_for_user


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


def _prefetch_module_lists(students):
    """Fetch module TaskLists grouped by (user_id, module_id)."""
    lists = TaskList.objects.filter(user__in=students, category="uni")
    result = defaultdict(dict)
    for tl in lists:
        if " - " in tl.name:
            code = tl.name.split(" - ")[0]
            module = Module.objects.filter(module_code=code).first()
            if module:
                result[tl.user_id][module.id] = tl
    return result


def _build_all_reading_tasks(students, readings_by_module, enrollments_by_student,
                              personal_lists, module_lists):
    """Build all reading tasks for all students."""
    tasks = []
    for student in students:
        module_ids = enrollments_by_student.get(student.id, set())
        default_list = personal_lists.get(student.id)
        if not default_list:
            continue
        user_module_lists = module_lists.get(student.id, {})
        user_tasks = build_reading_tasks_for_user(
            student, module_ids, readings_by_module, user_module_lists, default_list
        )
        tasks.extend(user_tasks)
    return tasks


def _update_all_reading_estimates(students):
    """Update reading estimates for all students with tasks."""
    for student in students:
        if Task.objects.filter(user=student, reading__isnull=False).exists():
            update_reading_estimates(student)


@transaction.atomic
def create_readings(modules, students, stdout):
    """Create readings for modules and reading tasks for students."""
    stdout.write("Seeding readings...")

    # Create readings for modules
    readings = _build_all_readings(modules)
    Reading.objects.bulk_create(readings, ignore_conflicts=True, batch_size=500)
    stdout.write(f"  Created {len(readings)} readings across {len(modules)} modules.")

    # Prefetch all needed data
    readings_by_module = _prefetch_readings_by_module()
    enrollments_by_student = _prefetch_enrollments_by_student(students)
    personal_lists = _prefetch_personal_lists(students)
    module_lists = _prefetch_module_lists(students)

    # Build and create reading tasks
    tasks = _build_all_reading_tasks(
        students, readings_by_module, enrollments_by_student,
        personal_lists, module_lists
    )
    Task.objects.bulk_create(tasks, ignore_conflicts=True, batch_size=500)
    stdout.write(f"  Created {len(tasks)} reading tasks for {len(students)} students.")

    # Update estimates
    _update_all_reading_estimates(students)
    stdout.write(f"  {Reading.objects.count()} total readings in database.")
