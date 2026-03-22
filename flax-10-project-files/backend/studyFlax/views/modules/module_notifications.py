"""
Module notification helpers for module lifecycle events.
"""

from studyFlax.models import Enrollment
from studyFlax.models.notifications.notification_model import Notification


def notify_enrolled_students(module):
    enrollments = Enrollment.objects.filter(module=module).select_related('student')
    notifications = [build_module_deleted_notification(item.student, module) for item in enrollments]
    Notification.objects.bulk_create(notifications)


def build_module_deleted_notification(student, module):
    return Notification(
        user=student,
        title=f"Module removed: {module.module_code}",
        message=f"The module '{module.module_name}' has been deleted by the instructor.",
        notification_type='module_deleted',
    )
