"""
Reading task creation helpers for module readings.
"""

import math

from rest_framework import status
from rest_framework.response import Response

from studyFlax.models import Task
from studyFlax.utils.reading_utils import MINUTES_PER_BLOCK, estimated_time_reading
from studyFlax.views.modules.reading_task_lists import get_reading_list


def create_description(reading):
    chapter_part = reading.chapter or ''
    page_part = f"pages. {reading.start_page}-{reading.end_page}"
    details = ', '.join(part for part in [reading.title, chapter_part, page_part] if part)
    return details or reading.title


def task_payload(task):
    return {
        'id': task.id,
        'title': task.title,
        'due_date': task.due_date,
        'estimated_blocks': task.estimated_blocks,
        'reading_id': task.reading_id,
        'task_list': task.task_list_id,
        'page_count': task.page_count,
    }


def create_reading_task(user, reading):
    task = Task.objects.create(**build_task_data(user, reading))
    return Response(task_payload(task), status=status.HTTP_201_CREATED)


def build_task_data(user, reading):
    estimated_minutes = estimated_time_reading(reading, user)
    return {
        'user': user,
        'title': reading.title,
        'description': create_description(reading),
        'due_date': reading.deadline,
        'module': reading.module,
        'priority': 'medium',
        'estimated_blocks': estimated_blocks(estimated_minutes),
        'reading': reading,
        'task_list': get_reading_list(user, reading.module),
        'page_count': reading.page_count(),
    }


def estimated_blocks(estimated_minutes):
    block_count = estimated_minutes / MINUTES_PER_BLOCK
    return max(1, math.ceil(block_count))
