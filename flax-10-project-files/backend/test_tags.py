import django
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Flax10.settings")
django.setup()

from studyFlax.models import CalendarEvent, User, Module
from studyFlax.views.calendar.system_tags import get_lecture_tag, get_exam_tag, get_deadline_tag, get_schedule_tag

print("Lecture tag:", get_lecture_tag().name, get_lecture_tag().id)
print("Exam tag:", get_exam_tag().name, get_exam_tag().id)
print("Deadline tag:", get_deadline_tag().name, get_deadline_tag().id)
print("Schedule tag:", get_schedule_tag().name, get_schedule_tag().id)

# Find latest module related events and check their tags
events = CalendarEvent.objects.filter(module__isnull=False).order_by('-id')[:10]
for e in events:
    tag_name = e.tag.name if e.tag else None
    print(f"Event {e.id}: {e.title} | Source: {e.source} | Tag: {tag_name}")

