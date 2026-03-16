"""
Task creation helpers for the seed management command.
"""

from datetime import timedelta

from django.utils import timezone

from studyFlax.models import Enrollment
from studyFlax.models.tasks.taskModel import Task, TaskList
from studyFlax.fixtures.data_fixtures import (
    module_task_templates, personal_task_fixtures, task_list_fixtures,
)

def _create_task_lists(user):
    lists_by_name = {}
    for list_name, list_category, list_emoji in task_list_fixtures:
        tl, _ = TaskList.objects.get_or_create(
            user=user, name=list_name,
            defaults={"category": list_category},
        )
        lists_by_name[list_name] = tl
    return lists_by_name

def _get_templates_for_module(mod):
    prefix = mod.module_code[:2]
    return module_task_templates.get(
        mod.module_code,
        module_task_templates.get(prefix, []),
    )

def _adjust_days(mod, index, days_from_now):
    odd_days = [1, 3, 5]
    even_days = [2, 4, 6]
    if mod.module_code == 'LS4101':
        return odd_days[index % len(odd_days)]
    if mod.module_code == 'LS4202':
        return even_days[index % len(even_days)]
    return days_from_now

def _adjust_blocks(mod, title_tmpl, estimated_blocks):
    lower = title_tmpl.lower()
    if mod.module_code == 'LS4101' and any(x in lower for x in ('lab', 'microscopy', 'cell division')):
        return estimated_blocks + 1
    if mod.module_code == 'LS4202' and any(x in lower for x in ('enzyme', 'protein folding', 'metabolic')):
        return estimated_blocks + 1
    return estimated_blocks

def _build_due_date(now, days_from_now):
    return (now + timedelta(days=days_from_now)).replace(
        hour=23, minute=59, second=0, microsecond=0,
    )

def _create_module_task(user, uni_list, mod, title_tmpl, description,
                        priority, estimated_blocks, days_from_now, index, now):
    days = _adjust_days(mod, index, days_from_now)
    blocks = _adjust_blocks(mod, title_tmpl, estimated_blocks)
    title = title_tmpl.format(module=mod.module_code, module_name=mod.module_name)
    Task.objects.create(
        user=user, task_list=uni_list, module=mod,
        title=title, description=description, priority=priority,
        due_date=_build_due_date(now, days),
        estimated_blocks=blocks, completed=False,
    )

def _seed_enrollment_tasks(user, uni_list, module, now):
    templates = _get_templates_for_module(module)
    for i, (title_tmpl, desc, priority, blocks, days) in enumerate(templates):
        _create_module_task(user, uni_list, module, title_tmpl, desc, priority, blocks, days, i, now)
    return len(templates)

def _seed_module_tasks(user, uni_list, now):
    enrolled = list(Enrollment.objects.filter(student=user).select_related('module'))
    return sum(_seed_enrollment_tasks(user, uni_list, e.module, now) for e in enrolled)

def _seed_personal_tasks(user, lists_by_name, personal_list, now):
    count = 0
    for title, description, priority, blocks, days, list_name in personal_task_fixtures:
        task_list = lists_by_name.get(list_name, personal_list)
        Task.objects.create(
            user=user, task_list=task_list, module=None,
            title=title, description=description, priority=priority,
            due_date=_build_due_date(now, days),
            estimated_blocks=blocks, completed=False,
        )
        count += 1
    return count

def _seed_tasks_for_user(user, now):
    if Task.objects.filter(user=user).exists():
        return 0
    lists_by_name = _create_task_lists(user)
    uni_list = lists_by_name.get("University")
    personal_list = lists_by_name.get("Personal")
    total = _seed_module_tasks(user, uni_list, now)
    total += _seed_personal_tasks(user, lists_by_name, personal_list, now)
    return total

def create_tasks(users, stdout):
    stdout.write("Seeding tasks...")
    now = timezone.now()
    total = sum(_seed_tasks_for_user(user, now) for user in users)
    stdout.write(f"  Created {total} tasks.")
