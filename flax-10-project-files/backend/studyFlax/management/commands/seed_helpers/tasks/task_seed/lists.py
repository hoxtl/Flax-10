"""
Task-list and due-date helpers for seeded tasks.
"""

from datetime import timedelta

from studyFlax.models.tasks.task_model import TaskList


SEEDED_TASK_DUE_HOUR = 20
SEEDED_TASK_DUE_MINUTE = 0


def _apply_seed_due_time(date_value):
    return date_value.replace(hour=SEEDED_TASK_DUE_HOUR, minute=SEEDED_TASK_DUE_MINUTE, second=0, microsecond=0)

def build_due_date(now, days_from_now):
    """Build the seeded due date from a base time and day offset."""
    return _apply_seed_due_time(now + timedelta(days=days_from_now))

def build_completed_at(now, due_date, completed):
    """Build the completed-at timestamp for seeded task fixtures."""
    if not completed:
        return None
    return min(now, due_date)

def create_task_lists(user, fixtures):
    lists_by_name = {}
    for list_name, list_category, list_emoji in fixtures:
        del list_emoji
        task_list, _ = TaskList.objects.get_or_create(
            user=user,
            name=list_name,
            defaults={"category": list_category},
        )
        lists_by_name[list_name] = task_list
    return lists_by_name

def create_module_reading_lists(user, enrolled_modules):
    """Create a reading task list for every enrolled module."""
    lists_by_module = {}
    for module in enrolled_modules:
        name = f"{module.module_code} - {module.module_name}"
        task_list, _ = TaskList.objects.get_or_create(
            user=user,
            name=name,
            defaults={"category": "uni"},
        )
        lists_by_module[module.id] = task_list
    return lists_by_module

def ensure_society_task_list(user, society):
    """Ensure the named society admin list exists with the correct fields."""
    task_list, created = TaskList.objects.get_or_create(
        user=user,
        society=society,
        defaults={"name": f"{society.name} Admin", "category": "society"},
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

