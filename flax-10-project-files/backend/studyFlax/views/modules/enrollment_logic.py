"""
Enrollment business rules for module enrollment flows.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import OperationalError
from django.utils import timezone

from studyFlax.fixtures.data_fixtures import get_course_prefixes
from studyFlax.fixtures.module_fixtures import module_fixtures
from studyFlax.models import Enrollment, Module
from studyFlax.models.calendar.recurrence_rule_model import RecurrenceRule
from studyFlax.views.modules import enrollment_event_service

create_enrollment_events = enrollment_event_service.create_enrollment_events
logger = enrollment_event_service.logger
_is_running_tests = enrollment_event_service.is_running_tests

_LECTURE_HOURS = [9, 10, 11, 14, 15, 16]


def _log_create_failure(user, module, exc):
    if not _is_running_tests():
        logger.debug("Failed to create events for %s / %s: %s", user, module, exc)

def _safe_create_enrollment_events(user, module):
    try:
        create_enrollment_events(user, module)
    except OperationalError as exc:
        _log_create_failure(user, module, exc)


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


def _get_system_teacher():
    User = get_user_model()
    return (
        User.objects.filter(role='teacher').first()
        or User.objects.filter(is_staff=True).first()
    )

def _get_weekly_rule():
    rule, _ = RecurrenceRule.objects.get_or_create(frequency='weekly', interval=1)
    return rule

def _module_start_time(code):
    now = timezone.now()
    weekday = abs(hash(code)) % 5
    hour = _LECTURE_HOURS[abs(hash(code + 'h')) % len(_LECTURE_HOURS)]
    days_ahead = (weekday - now.weekday()) % 7 or 7
    return (now + timedelta(days=days_ahead)).replace(
        hour=hour, minute=0, second=0, microsecond=0
    )

def _ensure_modules_exist_for_major(prefixes):
    teacher = _get_system_teacher()
    if not teacher:
        return
    weekly_rule = _get_weekly_rule()
    prefix_set = set(prefixes)
    for code, name, description in module_fixtures:
        if code[:2] not in prefix_set:
            continue
        if Module.objects.filter(module_code=code).exists():
            continue
        start = _module_start_time(code)
        Module.objects.create(
            module_code=code,
            module_name=name,
            description=description,
            created_by=teacher,
            start_time=start,
            end_time=start + timedelta(hours=2),
            recurrence_rule=weekly_rule,
        )

def get_modules_for_major(major):
    prefixes = _get_major_prefixes(major)
    if not prefixes:
        return []
    pattern = r'^(' + '|'.join(prefixes) + ')'
    modules = list(Module.objects.filter(module_code__regex=pattern))
    if not modules:
        _ensure_modules_exist_for_major(prefixes)
        modules = list(Module.objects.filter(module_code__regex=pattern))
    return modules


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
