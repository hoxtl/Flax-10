"""
Utility functions for estimating reading time and updating task estimates.
"""

import math
from studyFlax.models.tasks.task_model import Task

DEFAULT_PAGE_TIME = 2.0
MINUTES_PER_BLOCK = 25

def _completed_reading_tasks(user):
    return Task.objects.filter(
        user=user, completed=True,
        reading__isnull=False, time_spent_minutes__gt=0
    ).select_related('reading')

def _completed_manual_page_tasks(user):
    return Task.objects.filter(
        user=user, completed=True,
        reading__isnull=True, page_count__isnull=False, time_spent_minutes__gt=0,
    )

def _sum_reading_task_pages(tasks):
    return sum(task.reading.page_count() for task in tasks)

def _sum_task_pages(tasks):
    return sum(task.page_count for task in tasks)

def _sum_task_minutes(tasks):
    return sum(task.time_spent_minutes for task in tasks)

def _totals_for_avg_page_time(user):
    reading_tasks = _completed_reading_tasks(user)
    manual_tasks = _completed_manual_page_tasks(user)
    total_pages = _sum_reading_task_pages(reading_tasks) + _sum_task_pages(manual_tasks)
    total_minutes = _sum_task_minutes(reading_tasks) + _sum_task_minutes(manual_tasks)
    return total_pages, total_minutes

def get_avg_time_per_page(user):
    total_pages, total_minutes = _totals_for_avg_page_time(user)
    if total_pages == 0:
        return DEFAULT_PAGE_TIME
    return total_minutes / total_pages

def estimated_time_reading(reading, user):
    if reading.estimated_minutes is not None:
        return reading.estimated_minutes
    return round(reading.page_count() * get_avg_time_per_page(user))

def estimated_blocks_per_page(page_count, avg):
    return max(1, math.ceil(page_count * avg / MINUTES_PER_BLOCK))

def update_estimate_blocks(task, new_blocks):
    if new_blocks != task.estimated_blocks:
        task.estimated_blocks = new_blocks
        task.save(update_fields=['estimated_blocks'])

def update_reading_estimates(user):
    avg = get_avg_time_per_page(user)
    for task in Task.objects.filter(
        user=user, completed=False, reading__isnull=False
    ).select_related('reading'):
        update_estimate_blocks(task, estimated_blocks_per_page(task.reading.page_count(), avg))

    for task in Task.objects.filter(
        user=user, completed=False,
        reading__isnull=True, page_count__isnull=False
    ):
        update_estimate_blocks(task, estimated_blocks_per_page(task.page_count, avg))
