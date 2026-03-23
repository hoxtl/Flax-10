"""
Task seeding helpers for group projects.
"""

import random
from datetime import timedelta

from studyFlax.models.tasks.task_model import Task
from studyFlax.fixtures.groupwork_fixtures import GROUP_TASK_TEMPLATES

PROJECT_TASK_STATUS_PATTERNS = (
    ("todo", "todo", "in_progress", "todo", "todo"),
    ("done", "in_progress", "todo", "todo", "todo"),
    ("done", "done", "in_progress", "todo", "todo"),
    ("done", "done", "in_progress", "in_progress", "todo"),
    ("done", "done", "done", "in_progress", "todo"),
    ("done", "done", "done", "done", "todo"),
)
ZERO_PROGRESS_PROJECT_COUNT = 0


def _get_project_status_pattern(project, project_index):
    if project_index < ZERO_PROGRESS_PROJECT_COUNT:
        return PROJECT_TASK_STATUS_PATTERNS[0]
    non_zero_count = max(len(PROJECT_TASK_STATUS_PATTERNS) - 1, 1)
    pattern_index = 1 + (sum(ord(char) for char in f"{project.course_code}:{project.name}") % non_zero_count)
    return PROJECT_TASK_STATUS_PATTERNS[pattern_index]

def _build_completed_fields(status, task_index, now):
    is_completed = (status == 'done')
    completed_at = now - timedelta(days=min(task_index, 4)) if is_completed else None
    return is_completed, completed_at

def _build_task_due_date(due, task_index, now):
    lead_days = max(0, min(task_index + 1, max((due.date() - now.date()).days, 0)))
    return due - timedelta(days=lead_days)

def _build_completed_task_assignments(members, status_pattern):
    completed_indexes = [index for index, status in enumerate(status_pattern) if status == "done"]
    if not completed_indexes:
        return {}
    assignments = {index: [] for index in completed_indexes}
    for member_index, member in enumerate(members):
        task_index = completed_indexes[member_index % len(completed_indexes)]
        assignments[task_index].append(member)
    return assignments

def _get_done_assignees(task_index, status, completed_assignments):
    if status != "done":
        return []
    return completed_assignments.get(task_index, [])

def _build_task_assignees(members, task_index, status, completed_assignments):
    assigned = _get_done_assignees(task_index, status, completed_assignments)
    if assigned:
        return assigned
    primary = members[task_index % len(members)]
    if len(members) > 1 and task_index % 2 == 0:
        return [primary, members[(task_index + 1) % len(members)]]
    return [primary]

def _build_task_defaults(template, status, task_index, due, now):
    """Return the defaults dict for Task.objects.update_or_create."""

    t_title, t_desc, t_priority, t_blocks = template
    is_completed, completed_at = _build_completed_fields(status, task_index, now)
    has_due_date = not (status == "todo" and task_index >= 3)
    task_due = _build_task_due_date(due, task_index, now) if has_due_date else None
    return {
        'description': t_desc,
        'priority': t_priority,
        'estimated_blocks': t_blocks,
        'status': status,
        'completed': is_completed,
        'completed_at': completed_at,
        'due_date': task_due,
    }

def _create_single_group_task(project, members, due, template, task_index, now, rng, status_pattern, completed_assignments):
    del rng
    t_title = template[0]
    status = status_pattern[task_index % len(status_pattern)]
    defaults = _build_task_defaults(template, status, task_index, due, now)
    defaults['user'] = project.owner
    task, _ = Task.objects.update_or_create(
        group_project=project,
        title=t_title,
        defaults=defaults,
    )
    assignees = _build_task_assignees(members, task_index, status, completed_assignments)
    task.assigned_to.set(assignees)

def _seed_tasks_for_project(project, now, project_index):
    members = sorted([m.user for m in project.memberships.all()], key=lambda u: u.username)
    if not members:
        return
    due = project.deadline or (now + timedelta(days=14))
    rng = random.Random(f"studyflax-group-project-tasks:{project.name}")
    status_pattern = _get_project_status_pattern(project, project_index)
    completed_assignments = _build_completed_task_assignments(members, status_pattern)
    for task_index, template in enumerate(GROUP_TASK_TEMPLATES):
        _create_single_group_task(
            project, members, due, template, task_index, now, rng, status_pattern, completed_assignments,
        )
