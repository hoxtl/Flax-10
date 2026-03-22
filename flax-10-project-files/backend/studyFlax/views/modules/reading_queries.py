"""
Reading query helpers for module reading endpoints.
"""

from studyFlax.models import Enrollment, Reading, Task


def enrolled_module_ids(user):
    return Enrollment.objects.filter(student=user).values_list('module_id', flat=True)


def added_reading_ids(user):
    return Task.objects.filter(user=user, reading__isnull=False).values_list('reading_id', flat=True)


def get_suggested_readings(user):
    return Reading.objects.filter(
        module_id__in=enrolled_module_ids(user),
    ).exclude(
        id__in=added_reading_ids(user),
    ).select_related('module')
