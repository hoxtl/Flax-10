from studyFlax.models import Enrollment, CalendarEvent, Tag
from studyFlax.views.modules.deadline_event_helpers import create_enrollment_deadline_events

def enroll_user_in_module(user, module):
    """
    Enrolls a user in a module and creates associated lecture and deadline events.
    Returns (enrollment, created).
    """
    enrollment, created = Enrollment.objects.get_or_create(student=user, module=module)
    if created:
        create_enrollment_events(user, module)
    return enrollment, created

def create_enrollment_events(user, module):
    """
    Creates both lecture and deadline events for a module enrollment.
    """
    create_lecture_event(user, module)
    create_enrollment_deadline_events(user, module)

def create_lecture_event(user, module):
    """
    Creates a single recurring lecture event for a module.
    """
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

def get_lecture_tag():
    """
    Returns the 'Lecture' tag if it exists.
    """
    return Tag.objects.filter(name='Lecture').first()
