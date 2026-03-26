"""
Factories for building Reading instances and reading Task records.

Generates sample readings for modules and reading-history tasks for
students, used by the seed management command.
"""

import random
from datetime import timedelta

from django.utils import timezone

from studyFlax.fixtures.planning.data_fixtures import reading_fixtures

READING_DAY_OFFSETS = [1, 5, 14]


def _build_single_reading(module, title, chapter, start, end, deadline):
    """Build an unsaved Reading instance."""

    from studyFlax.models import Reading
    return Reading(
        module=module, title=title, chapter=chapter,
        start_page=start, end_page=end, deadline=deadline,
    )


def _build_reading_for_index(module, i, example, now):
    s, c, st, en = example
    offset = READING_DAY_OFFSETS[i % len(READING_DAY_OFFSETS)]
    return _build_single_reading(module, s, c, st, en, now + timedelta(days=offset))

def build_readings_for_module(module):
    """Return unsaved Reading instances for a module."""

    now = timezone.now()
    examples = random.sample(reading_fixtures, min(3, len(reading_fixtures)))
    return [_build_reading_for_index(module, i, ex, now) for i, ex in enumerate(examples)]


def _reading_task_fields(user, reading, task_list, completed):
    """Build field dict for a reading task."""

    pages = reading.page_count()
    speed = round(random.uniform(1.2, 2.5), 1)
    completed_at = timezone.now() - timedelta(days=random.randint(1, 14)) if completed else None
    return {
        'user': user, 'task_list': task_list, 'module': reading.module,
        'reading': reading, 'title': f"Read: {reading.title}", 'page_count': pages,
        'time_spent_minutes': round(pages * speed) if completed else 0,
        'completed': completed, 'completed_at': completed_at,
        'priority': 'medium', 'energy_level': 'medium', 'due_date': reading.deadline,
    }


def _build_reading_task(user, reading, task_list, completed):
    """Build an unsaved Task for a reading."""

    from studyFlax.models.tasks.task_model import Task
    if reading.page_count() <= 0:
        return None
    return Task(**_reading_task_fields(user, reading, task_list, completed))


def _build_task_for_reading(user, reading, task_list, index):
    """Build a task for a single reading at given index."""

    completed = (index == 0)
    return _build_reading_task(user, reading, task_list, completed)


def _build_module_reading_tasks(user, module_id, readings, task_list):
    """Build reading tasks for a module's readings."""

    if not readings:
        return []
    shuffled = readings[:]
    random.shuffle(shuffled)
    tasks = [_build_task_for_reading(user, r, task_list, i) for i, r in enumerate(shuffled[:2])]
    return [t for t in tasks if t]


def build_reading_tasks_for_user(user, module_ids, readings_by_module, task_lists_by_module, default_list):
    """Build all reading tasks for a user's enrolled modules."""

    tasks = []
    for module_id in module_ids:
        readings = readings_by_module.get(module_id, [])
        task_list = task_lists_by_module.get(module_id, default_list)
        tasks.extend(_build_module_reading_tasks(user, module_id, readings, task_list))
    return tasks
