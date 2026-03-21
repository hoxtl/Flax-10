"""
Auto schedule view orchestration.
"""

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response

from studyFlax.models import Schedule
from studyFlax.serialisers import ScheduleSerialiser

from .auto_scheduler_allocations import _allocate_deadline_blocks
from .auto_scheduler_preferences import _resolved_preferences
from .auto_scheduler_requests import _validate_auto_request
from .schedule_helpers import _overwrite_same_name_schedules


def build_auto_schedule(request):
    payload, deadline_map, deadlines = _validate_auto_request(request)
    if isinstance(deadlines, Response):
        return deadlines
<<<<<<< HEAD
    return _build_auto_schedule_response(request.user, payload, deadlines, deadline_map)

def _build_auto_schedule_response(user, payload, deadlines, deadline_map):
    prefs = _resolved_preferences(user, payload)
    schedule, overwritten = _create_auto_schedule(user, payload, deadlines, prefs)
    _allocate_deadline_blocks(schedule, user, deadlines, deadline_map, prefs)
    return _created_schedule_response(schedule, overwritten)

def _create_auto_schedule(user, payload, deadlines, prefs):
    return _create_auto_schedule_atomic(user, payload, deadlines, prefs)

=======

    prefs = _resolved_preferences(request.user, payload)
    schedule, overwritten = _create_auto_schedule(request.user, payload, deadlines, prefs)
    _allocate_deadline_blocks(schedule, request.user, deadlines, deadline_map, prefs)
    return _created_schedule_response(schedule, overwritten)


def _create_auto_schedule(user, payload, deadlines, prefs):
    return _create_auto_schedule_atomic(user, payload, deadlines, prefs)


>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def _create_auto_schedule_atomic(user, payload, deadlines, prefs):
    with transaction.atomic():
        _clear_existing_schedules(user, payload)
        overwritten = _overwrite_same_name_schedules(user, payload["title"])
        schedule = Schedule.objects.create(title=payload["title"], user=user, **prefs)
        schedule.deadline.set(deadlines)
    return schedule, overwritten

<<<<<<< HEAD
=======

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
def _clear_existing_schedules(user, payload):
    if payload.get("clear_existing"):
        user.schedules.all().delete()

<<<<<<< HEAD
def _build_schedule_payload(schedule, overwritten):
    data = ScheduleSerialiser(schedule).data
    data["overwritten"] = overwritten
    return data

def _created_schedule_response(schedule, overwritten):
    return Response(_build_schedule_payload(schedule, overwritten), status=status.HTTP_201_CREATED)
=======

def _created_schedule_response(schedule, overwritten):
    data = ScheduleSerialiser(schedule).data
    data["overwritten"] = overwritten
    return Response(data, status=status.HTTP_201_CREATED)
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
