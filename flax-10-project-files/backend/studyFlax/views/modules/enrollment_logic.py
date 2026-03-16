from studyFlax.models import Enrollment, CalendarEvent, Module, Tag
from studyFlax.views.modules.deadline_event_helpers import create_enrollment_deadline_events
from studyFlax.fixtures.data_fixtures import course_to_module_prefixes

def enroll_user_in_module(user, module):
    """Enroll a user in a module and create related events."""
    enrollment, created = Enrollment.objects.get_or_create(student=user, module=module)
    if created:
        create_enrollment_events(user, module)
    return enrollment, created

def get_modules_for_major(major):
    prefixes = course_to_module_prefixes.get(major, [])
    if not prefixes:
        return []
    pattern = r'^(' + '|'.join(prefixes) + ')'
    return list(Module.objects.filter(module_code__regex=pattern))

def enroll_user_in_modules(user, modules):
    """Return the number of new modules the user was enrolled in."""
    return sum(1 for module in modules if enroll_user_in_module(user, module)[1])

def is_core_module(user, module):
    """Return True if the module is core for the user's course."""
    user_course = getattr(getattr(user, 'settings', None), 'major', None)
    if not user_course:
        return False
    core_prefixes = course_to_module_prefixes.get(user_course, [])
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
    """Return the 'Lecture' tag if it exists."""
    return Tag.objects.filter(name='Lecture').first()
