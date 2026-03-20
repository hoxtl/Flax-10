"""
Factories for building Reading instances and completed reading Task records.

Generates sample readings for modules and reading-history tasks for
students, used by the seed management command.
"""

import random
from datetime import timedelta

from django.utils import timezone

from studyFlax.fixtures.data_fixtures import reading_fixtures


def _build_single_reading(module, title, chapter, start, end, now, days_offset=14):
    from studyFlax.models import Reading
    deadline = now + timedelta(days=days_offset)
    if Reading.objects.filter(module=module, title=title).exists():
        return None
    return Reading(
        module=module, title=title, chapter=chapter,
        start_page=start, end_page=end, deadline=deadline,
    )

READING_DAY_OFFSETS = [1, 5, 14]

def build_readings_for_module(module):
    """Return unsaved Reading instances for *module*."""
    now = timezone.now()
    examples = random.sample(reading_fixtures, min(3, len(reading_fixtures)))
    results = []
    for i, (s, c, st, en) in enumerate(examples):
        offset = READING_DAY_OFFSETS[i % len(READING_DAY_OFFSETS)]
        r = _build_single_reading(module, f"{module.module_name}: {s}", c, st, en, now, offset)
        if r:
            results.append(r)
    return results

def _build_reading_task(user, reading, reading_list, completed=True):
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
        page_count=pages,
        time_spent_minutes=round(pages * speed) if completed else 0,
        completed=completed,
        completed_at=timezone.now() - timedelta(days=random.randint(1, 14)) if completed else None,
        priority='medium', energy_level='medium', due_date=reading.deadline,
    )

def build_reading_user_history(user, modules, reading_list, module_reading_lists=None):
    """Return reading Task instances: some completed, some assigned, leaving a few as suggested."""
    results = []
    for m in modules:
        from studyFlax.models import Reading
        rl = (module_reading_lists or {}).get(m.id, reading_list)
        readings = list(Reading.objects.filter(module=m))
        if not readings:
            continue
        random.shuffle(readings)
        for i, reading in enumerate(readings):
            if i == 0:
                task = _build_reading_task(user, reading, rl, completed=True)
                if task:
                    results.append(task)
            elif i == 1:
                task = _build_reading_task(user, reading, rl, completed=False)
                if task:
                    results.append(task)
            # remaining readings (i >= 2) left as suggested
    return results
