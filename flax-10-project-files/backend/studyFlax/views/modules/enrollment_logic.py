"""
<<<<<<< HEAD
Enrolment rules for module registration flows.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import OperationalError
from django.utils import timezone

from studyFlax.fixtures.planning.data_fixtures import get_course_prefixes
from studyFlax.fixtures.catalogue.module_fixtures import module_fixtures
from studyFlax.models import Enrollment, Module
from studyFlax.models.calendar.recurrence_rule_model import RecurrenceRule
from studyFlax.views.modules import enrollment_event_service


create_enrollment_events = enrollment_event_service.create_enrollment_events
logger = enrollment_event_service.logger
_is_running_tests = enrollment_event_service.is_running_tests

_LECTURE_HOURS = [9, 10, 11, 14, 15, 16]


def _log_create_failure(user, module, exc):
    """Log event creation failures outside test runs."""
    if not _is_running_tests():
        logger.debug("Failed to create events for %s / %s: %s", user, module, exc)

def _safe_create_enrollment_events(user, module):
    """Create enrollment events without failing the enrollment flow."""
    try:
        create_enrollment_events(user, module)
    except OperationalError as exc:
        _log_create_failure(user, module, exc)
=======
Business logic for enrolling users in modules and creating related events.
"""

import logging
import sys

from django.db import OperationalError
from studyFlax.models import Enrollment, CalendarEvent, Module
from studyFlax.views.modules.deadline_event_helpers import create_enrollment_deadline_events
from studyFlax.fixtures.data_fixtures import get_course_prefixes
from studyFlax.views.calendar.system_tags import get_lecture_tag as get_default_lecture_tag

logger = logging.getLogger(__name__)

def _is_running_tests():
    return "test" in sys.argv

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

def _get_major_prefixes(major):
    return get_course_prefixes(major)

<<<<<<< HEAD
def _get_created_count(result):
    """Return whether a get-or-create call created a new row."""
=======

def _safe_create_enrollment_events(user, module):
    try:
        create_enrollment_events(user, module)
    except OperationalError as exc:
        _log_enrollment_creation_error(user, module, exc)


def _log_enrollment_creation_error(user, module, exc):
    if _is_running_tests():
        return
    logger.debug("Failed to create events for %s / %s: %s", user, module, exc)


def _get_created_count(result):
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    _, created = result
    return int(created)

def enroll_user_in_module(user, module):
<<<<<<< HEAD
    """Enroll a user in a module and create related events."""
=======
    """Enroll a user in a module and create related calendar events."""
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    enrollment, created = Enrollment.objects.get_or_create(student=user, module=module)
    if created:
        _safe_create_enrollment_events(user, module)
    return enrollment, created

<<<<<<< HEAD
def _get_system_teacher():
    User = get_user_model()
    return (
        User.objects.filter(role='teacher').first()
        or User.objects.filter(is_staff=True).first()
    )

def _get_weekly_rule():
    """Return the shared weekly recurrence rule."""
    rule, _ = RecurrenceRule.objects.get_or_create(frequency='weekly', interval=1)
    return rule

def _module_weekday(code):
    """Return a deterministic weekday for a module."""
    return abs(hash(code)) % 5

def _module_hour(code):
    """Return a deterministic lecture hour for a module."""
    return _LECTURE_HOURS[abs(hash(f'{code}h')) % len(_LECTURE_HOURS)]

def _days_until_weekday(now, weekday):
    """Return the days until the next matching weekday."""
    return (weekday - now.weekday()) % 7 or 7

def _next_module_start(now, code):
    """Return the next scheduled start time for a module."""
    days_ahead = _days_until_weekday(now, _module_weekday(code))
    return (now + timedelta(days=days_ahead)).replace(
        hour=_module_hour(code),
        minute=0,
        second=0,
        microsecond=0,
    )

def _module_start_time(code):
    now = timezone.now()
    return _next_module_start(now, code)

def _matches_major_prefix(code, prefix_set):
    """Return whether the module belongs to the major."""
    return code[:2] in prefix_set

def _module_already_exists(code):
    return Module.objects.filter(module_code=code).exists()

def _seed_module_payload(code, name, description, teacher, weekly_rule):
    start = _module_start_time(code)
    return {
        'module_code': code,
        'module_name': name,
        'description': description,
        'created_by': teacher,
        'start_time': start,
        'end_time': start + timedelta(hours=2),
        'recurrence_rule': weekly_rule,
    }

def _seedable_module_fixtures(prefixes):
    """Yield fixture modules that match the selected major."""
    prefix_set = set(prefixes)
    return [
        fixture
        for fixture in module_fixtures
        if _matches_major_prefix(fixture[0], prefix_set)
    ]

def _create_seed_module(code, name, description, teacher, weekly_rule):
    """Create a seeded module when it does not already exist."""
    if _module_already_exists(code):
        return
    Module.objects.create(**_seed_module_payload(code, name, description, teacher, weekly_rule))

def _ensure_modules_exist_for_major(prefixes):
    """Create missing seeded modules for the selected major."""
    teacher = _get_system_teacher()
    if not teacher:
        return
    weekly_rule = _get_weekly_rule()
    for code, name, description in _seedable_module_fixtures(prefixes):
        _create_seed_module(code, name, description, teacher, weekly_rule)

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
    """Enroll a user in each module and count new enrollments."""
    count = 0
    for module in modules:
        count += _get_created_count(enroll_user_in_module(user, module))
    return count

def is_core_module(user, module):
    """Return whether the module is part of the user's core major."""
    user_course = getattr(getattr(user, 'settings', None), 'major', None)
    if not user_course:
        return False
    core_prefixes = _get_major_prefixes(user_course)
    return module.module_code[:2] in core_prefixes
=======
def get_modules_for_major(major):
    prefixes = _get_major_prefixes(major)
    if not prefixes:
        return []
    pattern = r'^(' + '|'.join(prefixes) + ')'
    return list(Module.objects.filter(module_code__regex=pattern))

def enroll_user_in_modules(user, modules):
    """Enroll a user in every module in the list, returning the count of new enrolments."""
    count = 0
    for module in modules:
        count += _get_created_count(enroll_user_in_module(user, module))
    return count

def is_core_module(user, module):
    """Return True if the module is core for the user's course."""
    user_course = getattr(getattr(user, 'settings', None), 'major', None)
    if not user_course:
        return False
    core_prefixes = _get_major_prefixes(user_course)
    return module.module_code[:2] in core_prefixes

def create_enrollment_events(user, module):
    """Create lecture and deadline events for a new enrolment."""
    create_lecture_event(user, module)
    create_enrollment_deadline_events(user, module)

def create_lecture_event(user, module):
    """Create a recurring lecture event for a module."""
    return CalendarEvent.objects.create(
        user=user,
        module=module,
        tag=get_default_lecture_tag(),
        title=f"Lecture: {module.module_name}",
        start_time=module.start_time,
        end_time=module.end_time,
        recurrence_rule=module.recurrence_rule,
        location=module.location,
        priority='high',
        source="module_enrollment"
    )
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
