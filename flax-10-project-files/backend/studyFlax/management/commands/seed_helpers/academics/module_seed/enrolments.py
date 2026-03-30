"""
Deadline and enrolment seeding for modules.
"""

from collections import defaultdict
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from studyFlax.models import CalendarEvent, Deadline, Enrollment
from ...calendar.event_helpers import build_deadlines_for_module
from ..module_event_builders import collect_all_enrollments_and_events


User = get_user_model()


def _coursework_week_key(dt):
    iso = dt.isocalendar()
    return iso.year, iso.week

def _shift_deadline_by_weeks(deadline, weeks):
    delta = timedelta(weeks=weeks)
    deadline.start_due_date += delta
    if deadline.end_due_date:
        deadline.end_due_date += delta

def _sort_key(deadline):
    return (
        deadline.start_due_date,
        getattr(getattr(deadline, "module", None), "module_code", ""),
        deadline.title,
    )

def _shift_to_free_week(deadline, used_weeks):
    while _coursework_week_key(deadline.start_due_date) in used_weeks:
        _shift_deadline_by_weeks(deadline, 1)
    used_weeks.add(_coursework_week_key(deadline.start_due_date))

def _spread_coursework_deadlines(deadlines):
    used_weeks = set()
    coursework = [d for d in sorted(deadlines, key=_sort_key) if (d.deadline_type or "").lower() == "coursework"]
    for deadline in coursework:
        _shift_to_free_week(deadline, used_weeks)
    return deadlines

def create_deadlines(modules, stdout):
    """Build and persist seeded deadlines for all modules, spreading coursework to one per week."""
    del stdout
    deadlines_to_create = []
    for module in modules:
        deadlines_to_create.extend(build_deadlines_for_module(module))
    _spread_coursework_deadlines(deadlines_to_create)
    Deadline.objects.bulk_create(deadlines_to_create, ignore_conflicts=True)

def _prefetch_deadlines_by_module(modules):
    deadlines = Deadline.objects.filter(module__in=modules)
    grouped = defaultdict(list)
    for deadline in deadlines:
        grouped[deadline.module_id].append(deadline)
    return grouped

@transaction.atomic
def create_enrollments(modules, tags, stdout):
    """Create seeded enrolments and module events for all users."""
    del stdout
    now = timezone.now()
    deadlines_by_module = _prefetch_deadlines_by_module(modules)
    users = list(User.objects.all().select_related("settings"))
    all_enrolments, all_events = collect_all_enrollments_and_events(users, modules, tags, now, deadlines_by_module)
    Enrollment.objects.bulk_create(all_enrolments, ignore_conflicts=True, batch_size=500)
    CalendarEvent.objects.bulk_create(all_events, ignore_conflicts=True, batch_size=500)
