"""
Module notification helpers for module lifecycle events.
"""

from studyFlax.models import Enrollment, Module
from studyFlax.models.notifications.notification_model import Notification


MODULE_FIELD_LABELS = {
    'module_code': 'module code',
    'module_name': 'module name',
    'description': 'description',
    'teacher_name': 'tutor',
    'teacher_email': 'tutor email',
    'semester': 'semester',
    'year': 'year',
}

MODULE_MODEL_FIELD_NAMES = {
    field.attname if hasattr(field, 'attname') else field.name
    for field in Module._meta.concrete_fields
}


def get_changed_module_fields(module, validated_data):
    return [
        field_name
        for field_name, next_value in validated_data.items()
        if field_name in MODULE_MODEL_FIELD_NAMES and getattr(module, field_name) != next_value
    ]

def _get_enrollments(module):
    return Enrollment.objects.filter(module=module).select_related('student')

def notify_enrolled_students(module):
    enrollments = _get_enrollments(module)
    notifications = [build_module_deleted_notification(item.student, module) for item in enrollments]
    Notification.objects.bulk_create(notifications)

def notify_module_updated(module, updated_fields):
    if not updated_fields:
        return
    enrollments = _get_enrollments(module)
    notifications = [
        build_module_updated_notification(item.student, module, updated_fields)
        for item in enrollments
    ]
    Notification.objects.bulk_create(notifications)

def _format_updated_fields(updated_fields):
    labels = [MODULE_FIELD_LABELS.get(field, field.replace('_', ' ')) for field in updated_fields]
    if not labels:
        return 'details'
    if len(labels) == 1:
        return labels[0]
    if len(labels) == 2:
        return f'{labels[0]} and {labels[1]}'
    if len(labels) == 3:
        return f'{labels[0]}, {labels[1]}, and {labels[2]}'
    return 'details'

def build_module_updated_notification(student, module, updated_fields):
    changed_summary = _format_updated_fields(updated_fields)
    return Notification(
        user=student,
        title=f"Module updated: {module.module_code}",
        message=(
            f"The teacher updated '{module.module_name}' ({changed_summary}). "
            "Open the module to review the latest details."
        ),
        notification_type='module_updated',
        action_url=f"/modules?code={module.module_code}",
    )

def build_module_deleted_notification(student, module):
    return Notification(
        user=student,
        title=f"Module removed: {module.module_code}",
        message=f"The teacher deleted '{module.module_name}', so you have been unenrolled from this module.",
        notification_type='module_deleted',
        action_url='/modules',
    )
