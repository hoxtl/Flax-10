"""
Reading task list lookup helpers for module readings.
"""

from studyFlax.models.tasks.task_model import TaskList


def find_module_task_list(user, module):
    list_name = f"{module.module_code} - {module.module_name}"
    return TaskList.objects.filter(user=user, name=list_name, archived=False).first()

def find_legacy_reading_list(user, module):
    list_name = f"Reading List - {module.module_name}"
    return TaskList.objects.filter(user=user, name=list_name, archived=False).first()

def find_generic_reading_list(user):
    return TaskList.objects.filter(
        user=user,
        name__icontains='reading',
        archived=False,
    ).first()

def get_reading_list(user, module=None):
    if not module:
        return find_generic_reading_list(user)
    return (
        find_module_task_list(user, module)
        or find_legacy_reading_list(user, module)
        or find_generic_reading_list(user)
    )
