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
    Returns the default 'Lecture' tag, ensuring it exists as a default tag.
    """
    tag = Tag.objects.filter(name='Lecture', is_default=True).first()
    if tag:
        return tag
    return ensure_default_lecture_tag()


def ensure_default_lecture_tag():
    """
    Creates or converts a Lecture tag to be a default tag.
    Merges multiple Lecture tags if they exist.
    """
    lecture_tags = list(Tag.objects.filter(name='Lecture'))
    if not lecture_tags:
        return create_default_lecture_tag()
    primary_tag = lecture_tags[0]
    merge_duplicate_lecture_tags(primary_tag, lecture_tags[1:])
    make_tag_default(primary_tag)
    return primary_tag


def create_default_lecture_tag():
    return Tag.objects.create(
        name='Lecture', is_default=True, user=None,
        color='#4A90D9', default_duration=120
    )


def merge_duplicate_lecture_tags(primary_tag, duplicates):
    for dup in duplicates:
        CalendarEvent.objects.filter(tag=dup).update(tag=primary_tag)
        dup.delete()


def make_tag_default(tag):
    if tag.is_default and tag.user is None:
        return
    tag.is_default = True
    tag.user = None
    tag.save()
