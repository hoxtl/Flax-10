"""
Task seeding orchestration for users, modules, and teacher fixtures.
"""

from django.utils import timezone

from studyFlax.fixtures.planning.data_fixtures import (
    module_task_templates,
    personal_task_fixtures,
    task_list_fixtures,
    teacher_personal_task_fixtures,
    teacher_task_list_fixtures,
)
from studyFlax.models import Enrollment
from studyFlax.models.tasks.task_model import Task
from .lists import (
    _apply_seed_due_time,
    build_completed_at,
    build_due_date,
    create_module_reading_lists,
    create_task_lists,
)
from .society_tasks import create_society_tasks, seed_society_tasks_for_user


def _get_templates_for_module(module):
    prefix = module.module_code[:2]
    return module_task_templates.get(module.module_code, module_task_templates.get(prefix, []))


def _adjust_days(module, index, days_from_now):
    odd_days = [1, 3, 5]
    even_days = [2, 4, 6]
    if module.module_code == "LS4101":
        return odd_days[index % len(odd_days)]
    if module.module_code == "LS4202":
        return even_days[index % len(even_days)]
    return days_from_now


def _adjust_blocks(module, title_template, estimated_blocks):
    lower_title = title_template.lower()
    if module.module_code == "LS4101" and any(item in lower_title for item in ("lab", "microscopy", "cell division")):
        return estimated_blocks + 1
    if module.module_code == "LS4202" and any(item in lower_title for item in ("enzyme", "protein folding", "metabolic")):
        return estimated_blocks + 1
    return estimated_blocks


def _create_module_task(user, task_list, module, template, index, now):
    title_template, description, priority, estimated_blocks, days_from_now = template
    title = title_template.format(module=module.module_code, module_name=module.module_name)
    Task.objects.create(
        user=user,
        task_list=task_list,
        module=module,
        title=title,
        description=description,
        priority=priority,
        due_date=build_due_date(now, _adjust_days(module, index, days_from_now)),
        estimated_blocks=_adjust_blocks(module, title_template, estimated_blocks),
        completed=False,
    )


def _seed_module_tasks(user, lists_by_module, now):
    enrolled = list(Enrollment.objects.filter(student=user).select_related("module"))
    total = 0
    for enrollment in enrolled:
        task_list = lists_by_module.get(enrollment.module.id)
        if not task_list:
            continue
        for index, template in enumerate(_get_templates_for_module(enrollment.module)):
            _create_module_task(user, task_list, enrollment.module, template, index, now)
            total += 1
    return total


def _seed_personal_tasks(user, lists_by_name, personal_list, now):
    total = 0
    for title, description, priority, blocks, days, list_name in personal_task_fixtures:
        task_list = lists_by_name.get(list_name, personal_list)
        Task.objects.create(
            user=user,
            task_list=task_list,
            module=None,
            title=title,
            description=description,
            priority=priority,
            due_date=build_due_date(now, days),
            estimated_blocks=blocks,
            completed=False,
        )
        total += 1
    return total


def _seed_teacher_tasks(user, lists_by_name, now):
    first_list = next(iter(lists_by_name.values()), None)
    total = 0
    for title, description, priority, blocks, days, list_name, completed in teacher_personal_task_fixtures:
        due_date = build_due_date(now, days)
        Task.objects.create(
            user=user,
            task_list=lists_by_name.get(list_name, first_list),
            module=None,
            title=title,
            description=description,
            priority=priority,
            due_date=due_date,
            estimated_blocks=blocks,
            completed=completed,
            completed_at=build_completed_at(now, due_date, completed),
        )
        total += 1
    return total


def _seed_tasks_for_teacher(user, now):
    if Task.objects.filter(user=user).exists():
        return 0
    lists_by_name = create_task_lists(user, teacher_task_list_fixtures)
    return _seed_teacher_tasks(user, lists_by_name, now)


def _seed_tasks_for_user(user, now):
    if getattr(user, "role", None) == "teacher":
        return _seed_tasks_for_teacher(user, now)
    if Task.objects.filter(user=user).exists():
        return 0
    lists_by_name = create_task_lists(user, task_list_fixtures)
    enrolled = list(Enrollment.objects.filter(student=user).select_related("module"))
    modules = [enrollment.module for enrollment in enrolled]
    lists_by_module = create_module_reading_lists(user, modules)
    total = _seed_module_tasks(user, lists_by_module, now)
    total += _seed_personal_tasks(user, lists_by_name, lists_by_name.get("Personal"), now)
    return total


def _ensure_task_due_today(user, now):
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=0)
    if Task.objects.filter(user=user, due_date__gte=today_start, due_date__lte=today_end).exists():
        return
    first_task = Task.objects.filter(user=user).order_by("due_date").first()
    if not first_task:
        return
    first_task.due_date = _apply_seed_due_time(now)
    first_task.save(update_fields=["due_date"])


def seed_new_user_tasks(user, now):
    """Seed module task lists and tasks for a newly registered user."""

    if Task.objects.filter(user=user).exists():
        return 0
    create_task_lists(user, task_list_fixtures)
    enrolled = list(Enrollment.objects.filter(student=user).select_related("module"))
    modules = [enrollment.module for enrollment in enrolled]
    lists_by_module = create_module_reading_lists(user, modules)
    total = _seed_module_tasks(user, lists_by_module, now)
    _ensure_task_due_today(user, now)
    return total


def create_tasks(users, stdout):
    """Seed personal, module, and teacher tasks for the supplied users."""

    now = timezone.now()
    total = sum(_seed_tasks_for_user(user, now) for user in users)
    stdout.write(f"  \u2713  {'Tasks':<14} {total:,}")


__all__ = [
    "_seed_tasks_for_user",
    "create_module_reading_lists",
    "create_society_tasks",
    "create_tasks",
    "seed_new_user_tasks",
    "seed_society_tasks_for_user",
]
