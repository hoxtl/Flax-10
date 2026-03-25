"""
Orchestrates creation of task lists and tasks for seeded users.
"""

from datetime import timedelta

from django.utils import timezone

from studyFlax.models import Enrollment, SocietyMembership
from studyFlax.models.tasks.task_model import Task, TaskList
from studyFlax.fixtures.data_fixtures import (
    module_task_templates, personal_task_fixtures, task_list_fixtures,
    teacher_task_list_fixtures, teacher_personal_task_fixtures,
)

SOCIETY_TASK_FIXTURES = (
    (
        "Plan the next {society} committee agenda",
        "Set priorities for the next committee meeting, confirm owners, and keep the society plan moving.",
        "high",
        2,
        1,
    ),
    (
        "Publish this week's {society} update",
        "Draft a clear post for members covering the next event, reminders, and anything that needs sign-off.",
        "medium",
        1,
        2,
    ),
    (
        "Review new {society} member requests",
        "Check recent joins, answer any questions, and make sure new members know what is happening next.",
        "medium",
        1,
        4,
    ),
    (
        "Update the {society} event checklist",
        "Check venue, timings, and promotion details so the next session runs smoothly.",
        "low",
        1,
        6,
    ),
)

SEEDED_TASK_DUE_HOUR = 20
SEEDED_TASK_DUE_MINUTE = 0


def _apply_seed_due_time(date_value):
    return date_value.replace(
        hour=SEEDED_TASK_DUE_HOUR,
        minute=SEEDED_TASK_DUE_MINUTE,
        second=0,
        microsecond=0,
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

def create_module_reading_lists(user, enrolled_modules):
    """Create a '{module_code} - {module_name}' reading TaskList for each enrolled module."""

    lists_by_module = {}
    for module in enrolled_modules:
        name = f"{module.module_code} - {module.module_name}"
        tl, _ = TaskList.objects.get_or_create(
            user=user, name=name,
            defaults={"category": "uni"},
        )
        lists_by_module[module.id] = tl
    return lists_by_module

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
    return _apply_seed_due_time(now + timedelta(days=days_from_now))

def _build_completed_at(now, due_date, completed):
    if not completed:
        return None
    return min(now, due_date)

def _create_module_task(user, task_list, mod, title_tmpl, description,
                        priority, estimated_blocks, days_from_now, index, now):
    days = _adjust_days(mod, index, days_from_now)
    blocks = _adjust_blocks(mod, title_tmpl, estimated_blocks)
    title = title_tmpl.format(module=mod.module_code, module_name=mod.module_name)
    Task.objects.create(
        user=user, task_list=task_list, module=mod,
        title=title, description=description, priority=priority,
        due_date=_build_due_date(now, days),
        estimated_blocks=blocks, completed=False,
    )

def _seed_enrollment_tasks(user, task_list, module, now):
    templates = _get_templates_for_module(module)
    for i, (title_tmpl, desc, priority, blocks, days) in enumerate(templates):
        _create_module_task(user, task_list, module, title_tmpl, desc, priority, blocks, days, i, now)
    return len(templates)

def _seed_enrollment_if_listed(user, enrollment, lists_by_module, now):
    """Seed tasks for an enrollment if it has a task list."""

    task_list = lists_by_module.get(enrollment.module.id)
    return _seed_enrollment_tasks(user, task_list, enrollment.module, now) if task_list else 0


def _seed_module_tasks(user, lists_by_module, now):
    """Seed tasks for all user's enrolled modules."""

    enrolled = list(Enrollment.objects.filter(student=user).select_related('module'))
    return sum(_seed_enrollment_if_listed(user, e, lists_by_module, now) for e in enrolled)

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

def _create_teacher_task_lists(user):
    lists_by_name = {}
    for list_name, list_category, list_emoji in teacher_task_list_fixtures:
        tl, _ = TaskList.objects.get_or_create(
            user=user, name=list_name,
            defaults={"category": list_category},
        )
        lists_by_name[list_name] = tl
    return lists_by_name

def _seed_teacher_tasks(user, lists_by_name, now):
    first_list = next(iter(lists_by_name.values()), None)
    count = 0
    for title, description, priority, blocks, days, list_name, completed in teacher_personal_task_fixtures:
        task_list = lists_by_name.get(list_name, first_list)
        due_date = _build_due_date(now, days)
        Task.objects.create(
            user=user, task_list=task_list, module=None,
            title=title, description=description, priority=priority,
            due_date=due_date,
            estimated_blocks=blocks,
            completed=completed,
            completed_at=_build_completed_at(now, due_date, completed),
        )
        count += 1
    return count

def _seed_tasks_for_teacher(user, now):
    if Task.objects.filter(user=user).exists():
        return 0
    lists_by_name = _create_teacher_task_lists(user)
    return _seed_teacher_tasks(user, lists_by_name, now)

def _seed_tasks_for_user(user, now):
    if getattr(user, 'role', None) == 'teacher':
        return _seed_tasks_for_teacher(user, now)
    if Task.objects.filter(user=user).exists():
        return 0
    lists_by_name = _create_task_lists(user)
    personal_list = lists_by_name.get("Personal")
    enrolled = list(Enrollment.objects.filter(student=user).select_related('module'))
    modules = [e.module for e in enrolled]
    lists_by_module = create_module_reading_lists(user, modules)
    total = _seed_module_tasks(user, lists_by_module, now)
    total += _seed_personal_tasks(user, lists_by_name, personal_list, now)
    return total


def _ensure_society_task_list(user, society):
    task_list, created = TaskList.objects.get_or_create(
        user=user,
        society=society,
        defaults={
            "name": f"{society.name} Admin",
            "category": "society",
        },
    )
    updates = []
    if task_list.category != "society":
        task_list.category = "society"
        updates.append("category")
    if task_list.name != f"{society.name} Admin":
        task_list.name = f"{society.name} Admin"
        updates.append("name")
    if updates and not created:
        task_list.save(update_fields=updates)
    return task_list


def _seed_society_task_list(user, society, task_list, now):
    if Task.objects.filter(user=user, task_list=task_list).exists():
        return 0

    count = 0
    for title_template, description_template, priority, blocks, days in SOCIETY_TASK_FIXTURES:
        Task.objects.create(
            user=user,
            task_list=task_list,
            title=title_template.format(society=society.name),
            description=description_template.format(society=society.name),
            priority=priority,
            due_date=_build_due_date(now, days),
            estimated_blocks=blocks,
            completed=False,
        )
        count += 1
    return count


def seed_society_tasks_for_user(user, now):
    memberships = list(
        SocietyMembership.objects.filter(user=user, role__in=["admin", "editor"]).select_related("society")
    )
    total = 0
    for membership in memberships:
        task_list = _ensure_society_task_list(user, membership.society)
        total += _seed_society_task_list(user, membership.society, task_list, now)
    return total


def create_society_tasks(stdout):
    now = timezone.now()
    memberships = SocietyMembership.objects.filter(role__in=["admin", "editor"]).select_related("user")
    users = {membership.user_id: membership.user for membership in memberships}
    total = sum(seed_society_tasks_for_user(user, now) for user in users.values())
    stdout.write(f"  \u2713  {'Society tasks':<14} {total:,}")

def _ensure_task_due_today(user, lists_by_module, now):
    """If no tasks are due today, set the first module task's due date to today."""

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=0)
    today_due = _apply_seed_due_time(now)
    has_today = Task.objects.filter(
        user=user, due_date__gte=today_start, due_date__lte=today_end
    ).exists()
    if has_today:
        return
    first_task = Task.objects.filter(user=user).order_by('due_date').first()
    if first_task:
        first_task.due_date = today_due
        first_task.save(update_fields=['due_date'])

def seed_new_user_tasks(user, now):
    """Seed task lists and module tasks for a newly registered user.
    Creates reading lists for each enrolled module and module-specific tasks,
    but does NOT add the personal fixture tasks (those are for seeded demo users only).
    Ensures at least one task is due today.
    """

    if Task.objects.filter(user=user).exists():
        return 0
    _create_task_lists(user)
    enrolled = list(Enrollment.objects.filter(student=user).select_related('module'))
    modules = [e.module for e in enrolled]
    lists_by_module = create_module_reading_lists(user, modules)
    total = _seed_module_tasks(user, lists_by_module, now)
    _ensure_task_due_today(user, lists_by_module, now)
    return total

def create_tasks(users, stdout):
    now = timezone.now()
    total = sum(_seed_tasks_for_user(user, now) for user in users)
    stdout.write(f"  \u2713  {'Tasks':<14} {total:,}")
