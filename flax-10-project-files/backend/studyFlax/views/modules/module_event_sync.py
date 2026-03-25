"""
Module calendar event sync helpers for module updates.
"""

from studyFlax.models import CalendarEvent


def sync_module_calendar_events(module):
    CalendarEvent.objects.filter(module=module).update(
        title=f"Lecture: {module.module_name}",
        start_time=module.start_time,
        end_time=module.end_time,
        location=module.location,
    )
