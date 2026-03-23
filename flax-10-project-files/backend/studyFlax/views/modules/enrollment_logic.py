"""
Enrollment business rules for module enrollment flows.
"""

from django.db import OperationalError

from studyFlax.fixtures.data_fixtures import get_course_prefixes
from studyFlax.models import Enrollment, Module
from studyFlax.views.modules import enrollment_event_service

create_enrollment_events = enrollment_event_service.create_enrollment_events
logger = enrollment_event_service.logger
_is_running_tests = enrollment_event_service.is_running_tests


def _safe_create_enrollment_events(user, module):
    try:
        create_enrollment_events(user, module)
    except OperationalError as exc:
        if not _is_running_tests():
            logger.debug("Failed to create events for %s / %s: %s", user, module, exc)


def _get_major_prefixes(major):
    return get_course_prefixes(major)


def _get_created_count(result):
    _, created = result
    return int(created)


def enroll_user_in_module(user, module):
    enrollment, created = Enrollment.objects.get_or_create(student=user, module=module)
    if created:
        _safe_create_enrollment_events(user, module)
    return enrollment, created


def get_modules_for_major(major):
    prefixes = _get_major_prefixes(major)
    if not prefixes:
        return []
    pattern = r'^(' + '|'.join(prefixes) + ')'
    return list(Module.objects.filter(module_code__regex=pattern))


def enroll_user_in_modules(user, modules):
    count = 0
    for module in modules:
        count += _get_created_count(enroll_user_in_module(user, module))
    return count


def is_core_module(user, module):
    user_course = getattr(getattr(user, 'settings', None), 'major', None)
    if not user_course:
        return False
    core_prefixes = _get_major_prefixes(user_course)
    return module.module_code[:2] in core_prefixes
