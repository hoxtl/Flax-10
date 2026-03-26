"""
Deadline and enrolment seeding for modules.
"""

from collections import defaultdict

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from studyFlax.models import CalendarEvent, Deadline, Enrollment
from ...calendar.event_helpers import build_deadlines_for_module
from ..module_event_builders import collect_all_enrollments_and_events


User = get_user_model()


def create_deadlines(modules, stdout):
    del stdout
    deadlines_to_create = []
    for module in modules:
        deadlines_to_create.extend(build_deadlines_for_module(module))
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

