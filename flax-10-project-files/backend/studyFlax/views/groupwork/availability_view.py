"""
Views for computing and displaying group project meeting availability.
"""

from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.groupwork.groupwork_model import GroupProject
from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.views.calendar.event_helpers import expand_recurring_events

def _get_user_events(members, start, end):
    """Return a dict mapping user_id to their expanded events in the given window."""
    events = {}
    for user in members:
        qs = CalendarEvent.objects.filter(user=user, start_time__lte=end, end_time__gte=start)
        events[user.id] = expand_recurring_events(qs, start, end)
    return events

def _check_slot_free(user_id, user_events, slot_start, slot_end):
    """Return True if the user has no events overlapping the given time slot."""
    return not any(ev.start_time < slot_end and ev.end_time > slot_start for ev in user_events[user_id])

def _build_member_entry(m, user_events, slot_start, slot_end):
    """Build a single member availability entry dict for a time slot."""
    is_free = _check_slot_free(m.user.id, user_events, slot_start, slot_end)
    initials = (m.user.first_name[:1] + m.user.last_name[:1]).upper() if m.user.first_name and m.user.last_name else m.user.username[:2].upper()
    return {"id": m.user.id, "name": m.user.username, "is_free": is_free, "has_data": True, "initials": initials}

def _build_slot_members(memberships, user_events, slot_start, slot_end):
    """Build member availability list and free count for a time slot."""
    members = [_build_member_entry(m, user_events, slot_start, slot_end) for m in memberships]
    free_count = sum(1 for m in members if m["is_free"])
    return members, free_count

def _build_slot_entry(start, memberships, user_events):
    """Build a single time slot availability entry dict."""
    end = start + timedelta(hours=1)
    mems, free = _build_slot_members(memberships, user_events, start, end)
    return {
        "start": start.isoformat(),
        "label": start.strftime("%a %I%p").replace(" 0", " "),
        "free_count": free,
        "total_count": len(memberships),
        "members": mems,
    }

def _get_day_suggestions(day, now, memberships, user_events):
    """Return available time slots for a single day, skipping past hours."""
    return [
        _build_slot_entry(day.replace(hour=hour), memberships, user_events)
        for hour in range(9, 18)
        if day.replace(hour=hour) >= now
    ]

def _serialize_responses(responses):
    """Serialise meeting responses into a list of dicts."""
    return [{"user_id": r.user.id, "username": r.user.username, "status": r.status} for r in responses]

def _get_active_suggestions(project):
    """Return upcoming meeting suggestions with their responses."""
    qs = project.suggestions.filter(start_time__gte=timezone.now()).prefetch_related("responses__user", "suggested_by")
    return [
        {
            "id": s.id, "start": s.start_time.isoformat(), "end": s.end_time.isoformat(),
            "suggested_by": {"id": s.suggested_by.id, "username": s.suggested_by.username},
            "responses": _serialize_responses(s.responses.all()),
        }
        for s in qs
    ]

def _build_availability_response(project, current_user):
    """Build the availability response for all project members over 7 days."""
    memberships = project.memberships.select_related("user").all()
    now = timezone.now()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    user_events = _get_user_events([m.user for m in memberships], start, start + timedelta(days=7))
    slots = []
    for i in range(7):
        slots.extend(_get_day_suggestions(start + timedelta(days=i), now, memberships, user_events))
    slots.sort(key=lambda x: (-x["free_count"], x["start"]))
    return {"current_user_id": current_user.id, "suggestions": slots[:5], "active_suggestions": _get_active_suggestions(project)}

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def group_availability(request, project_id):
    """Return available meeting slots and active suggestions for a project."""
    project = get_object_or_404(GroupProject.objects.filter(memberships__user=request.user), id=project_id)
    return Response(_build_availability_response(project, request.user))
