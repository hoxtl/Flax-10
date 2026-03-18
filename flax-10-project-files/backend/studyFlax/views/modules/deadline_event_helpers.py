"""
Helpers for creating, syncing, and deleting deadline calendar events.
"""

from studyFlax.models import CalendarEvent, User

def event_data(deadline, user):
    return dict(
        user=user,
        module=deadline.module,
        title=f"{deadline.deadline_type.capitalize()}: {deadline.title}",
        start_time=deadline.start_due_date,
        end_time=deadline.end_due_date or deadline.start_due_date, 
        location=deadline.location,
        description=deadline.description,
        external_id = str(deadline.id),
        source='module_deadline',
        priority='high'
    )

def create_deadline_events(deadline):
    students = User.objects.filter(enrollments__module=deadline.module)
    for student in students:
        CalendarEvent.objects.create(**event_data(deadline,student))

def create_enrollment_deadline_events(user, module):
    for deadline in module.deadlines.all():
        CalendarEvent.objects.create(**event_data(deadline,user))
    
def sync_deadline_events(deadline):
    CalendarEvent.objects.filter(source='module_deadline', external_id = str(deadline.id)).update(
        title=f"{deadline.deadline_type.capitalize()}: {deadline.title}",
        start_time=deadline.start_due_date,
        end_time=deadline.end_due_date or deadline.start_due_date, 
        location=deadline.location,
    )

def delete_deadline_events(deadline):
    CalendarEvent.objects.filter(source='module_deadline',external_id = str(deadline.id)).delete()