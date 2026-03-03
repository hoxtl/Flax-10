from studyFlax.models import Enrollment, CalendarEvent
from studyFlax.views.modules.deadline_event_helpers import create_enrollment_deadline_events
from studyFlax.views.calendar.system_tags import get_lecture_tag


def enroll_user_in_module(user, module):
    enrollment, created = Enrollment.objects.get_or_create(student=user, module=module)
    if created:
        create_enrollment_events(user, module)
    return enrollment, created


def create_enrollment_events(user, module):
    create_lecture_event(user, module)
    create_enrollment_deadline_events(user, module)


def create_lecture_event(user, module):
    return CalendarEvent.objects.create(
        user=user,
        module=module,
        tag=get_lecture_tag(),
        title=f"Lecture: {module.module_name}",
        start_time=module.start_time,
        end_time=module.end_time,
        recurrence_rule=module.recurrence_rule,
        location=module.location,
        priority='high',
        source="module_enrollment"
    )
