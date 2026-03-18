"""
Factories for building Reading instances and completed reading Task records.

Generates sample readings for modules and reading-history tasks for
students, used by the seed management command.
"""

import random
from datetime import timedelta

from django.utils import timezone

from studyFlax.fixtures.data_fixtures import reading_fixtures


def _build_single_reading(module, title, chapter, start, end, now):
    from studyFlax.models import Reading
    deadline = now + timedelta(days=random.randint(7, 28))
    if Reading.objects.filter(module=module, title=title).exists():
        return None
    return Reading(
        module=module, title=title, chapter=chapter,
        start_page=start, end_page=end, deadline=deadline,
    )

def build_readings_for_module(module):
    """Return unsaved Reading instances for *module*."""
    now = timezone.now()
    examples = random.sample(reading_fixtures, random.randint(1, 2))
    results = [_build_single_reading(module, f"{module.module_name}: {s}", c, st, en, now) for s, c, st, en in examples]
    return [r for r in results if r is not None]

def _build_reading_task(user, reading, reading_list):
    from studyFlax.models import Task
    pages = reading.page_count()
    if pages <= 0:
        return None
    if Task.objects.filter(user=user, reading=reading).exists():
        return None
    speed = round(random.uniform(1.2, 2.5), 1)
    return Task(
        user=user, task_list=reading_list, module=reading.module,
        reading=reading, title=f"Read: {reading.title}",
        page_count=pages, time_spent_minutes=round(pages * speed),
        completed=True, completed_at=timezone.now() - timedelta(days=random.randint(1, 14)),
        priority='medium', energy_level='medium', due_date=reading.deadline,
    )

def _reading_task_for_module(user, module, reading_list):
    from studyFlax.models import Reading
    readings = list(Reading.objects.filter(module=module))
    if not readings:
        return None
    return _build_reading_task(user, random.choice(readings), reading_list)

def build_reading_user_history(user, modules, reading_list):
    """Return completed reading Task instances for a sample of the user's modules."""
    sampled = random.sample(modules, min(2, len(modules)))
    results = [_reading_task_for_module(user, m, reading_list) for m in sampled]
    return [t for t in results if t is not None]
