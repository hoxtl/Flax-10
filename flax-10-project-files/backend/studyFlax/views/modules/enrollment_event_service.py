"""
Enrollment event helpers for module enrollment flows.
"""

import logging
import sys

from django.db import OperationalError

from studyFlax.models import CalendarEvent
from studyFlax.views.calendar.system_tags import get_lecture_tag as get_default_lecture_tag
from studyFlax.views.modules.deadline_event_helpers import create_enrollment_deadline_events

logger = logging.getLogger(__name__)


def safe_create_enrollment_events(user, module):
    try:
        create_enrollment_events(user, module)
    except OperationalError as exc:
        log_enrollment_creation_error(user, module, exc)


def create_enrollment_events(user, module):
    create_lecture_event(user, module)
    create_enrollment_deadline_events(user, module)


def create_lecture_event(user, module):
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
        source='module_enrollment',
    )


def log_enrollment_creation_error(user, module, exc):
    if is_running_tests():
        return
    logger.debug("Failed to create events for %s / %s: %s", user, module, exc)


def is_running_tests():
    return 'test' in sys.argv
