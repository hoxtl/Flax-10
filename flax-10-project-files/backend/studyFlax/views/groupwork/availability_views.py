from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta, datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from studyFlax.models.groupwork.groupwork_models import GroupProject, GroupMembership
from studyFlax.models.calendar.calendarEventModel import CalendarEvent
from studyFlax.models.social.shareModel import CalendarShare
from studyFlax.views.calendar.event_helpers import expand_recurring_events

def _get_user_events(members, start, end):
    events = {}
    for user in members:
        qs = CalendarEvent.objects.filter(user=user, start_time__lte=end, end_time__gte=start)
        events[user.id] = expand_recurring_events(qs, start, end)
    return events

def _check_slot_free(user_id, user_events, slot_start, slot_end):
    for ev in user_events[user_id]:
        if ev.start_time < slot_end and ev.end_time > slot_start:
            return False
    return True

def _build_slot_members(memberships, user_events, slot_start, slot_end):
    members = []
    free_count = 0
    for m in memberships:
        is_free = _check_slot_free(m.user.id, user_events, slot_start, slot_end)
        if is_free: free_count += 1
        members.append({
            "id": m.user.id, "name": m.user.username, "is_free": is_free, "has_data": True,
            "initials": (m.user.first_name[:1] + m.user.last_name[:1]).upper() if m.user.first_name and m.user.last_name else m.user.username[:2].upper()
        })
    return members, free_count

def _get_day_suggestions(day, now, memberships, user_events):
    day_slots = []
    for hour in range(9, 18):
        start = day.replace(hour=hour)
        if start < now: continue
        end = start + timedelta(hours=1)
        mems, free = _build_slot_members(memberships, user_events, start, end)
        day_slots.append({"start": start.isoformat(), "label": start.strftime("%a %I%p").replace(" 0", " "), "free_count": free, "total_count": len(memberships), "members": mems})
    return day_slots

def _serialize_responses(responses):
    return [{"user_id": r.user.id, "username": r.user.username, "status": r.status} for r in responses]

def _get_active_suggestions(project):
    qs = project.suggestions.filter(start_time__gte=timezone.now()).prefetch_related("responses__user", "suggested_by")
    return [{
        "id": s.id, "start": s.start_time.isoformat(), "end": s.end_time.isoformat(),
        "suggested_by": {"id": s.suggested_by.id, "username": s.suggested_by.username},
        "responses": _serialize_responses(s.responses.all())
    } for s in qs]

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def group_availability(request, project_id):
    project = get_object_or_404(GroupProject.objects.filter(memberships__user=request.user), id=project_id)
    memberships = project.memberships.select_related("user").all()
    now = timezone.now()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=7)
    user_events = _get_user_events([m.user for m in memberships], start, end)
    
    suggestions = []
    for i in range(7):
        suggestions.extend(_get_day_suggestions(start + timedelta(days=i), now, memberships, user_events))
    
    suggestions.sort(key=lambda x: (-x["free_count"], x["start"]))
    return Response({
        "current_user_id": request.user.id,
        "suggestions": suggestions[:5],
        "active_suggestions": _get_active_suggestions(project)
    })
