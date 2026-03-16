"""
Business logic for enrolling users in modules and creating related events.
"""

import logging

from django.db import OperationalError
from studyFlax.models import Enrollment, CalendarEvent, Module
from studyFlax.views.modules.deadline_event_helpers import create_enrollment_deadline_events
from studyFlax.fixtures.data_fixtures import get_course_prefixes
from studyFlax.views.calendar.system_tags import get_lecture_tag as get_default_lecture_tag

logger = logging.getLogger(__name__)


def _get_major_prefixes(major):
    return get_course_prefixes(major)


def _safe_create_enrollment_events(user, module):
    try:
        create_enrollment_events(user, module)
    except OperationalError:
        logger.exception("Failed to create events for %s / %s", user, module)


def _get_created_count(result):
    _, created = result
    return int(created)

def enroll_user_in_module(user, module):
    """Enroll a user in a module and create related calendar events."""
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
