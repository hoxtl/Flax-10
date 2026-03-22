from datetime import timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from studyFlax.models.groupwork.groupwork_model import GroupProject
from studyFlax.models.calendar.calendar_event_model import CalendarEvent
from studyFlax.views.calendar.event_helpers import expand_recurring_events

SLOT_HOURS = range(9, 19)
SLOT_LIMIT = 10


def _get_user_events(members, start, end):
    events = {}
    for user in members:
        qs = CalendarEvent.objects.filter(user=user, start_time__lte=end, end_time__gte=start)
        events[user.id] = expand_recurring_events(qs, start, end)
    return events


def _check_slot_free(user_id, user_events, slot_start, slot_end):
    return not any(ev.start_time < slot_end and ev.end_time > slot_start for ev in user_events[user_id])


def _safe_photo_url(photo_field):
    try:
        return photo_field.url
    except Exception:
        return None


def _get_profile_photo_url(user):
    if user.profile_photo:
        return _safe_photo_url(user.profile_photo)
    return None


def _build_initials(user):
    if user.first_name and user.last_name:
        return f"{user.first_name[:1]}{user.last_name[:1]}".upper()
    return user.username[:2].upper()


def _build_member_payload(user):
    return {
        "id": user.id,
        "name": user.username,
        "username": user.username,
        "initials": _build_initials(user),
        "profile_photo_url": _get_profile_photo_url(user),
    }


def _build_member_entry(m, user_events, slot_start, slot_end):
    is_free = _check_slot_free(m.user.id, user_events, slot_start, slot_end)
    return {
        **_build_member_payload(m.user),
        "is_free": is_free,
        "has_data": True,
    }


def _build_slot_members(memberships, user_events, slot_start, slot_end):
    members = [_build_member_entry(m, user_events, slot_start, slot_end) for m in memberships]
    free_count = sum(1 for m in members if m["is_free"])
    return members, free_count


def _build_slot_entry(start, memberships, user_events):
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
    return [
        _build_slot_entry(day.replace(hour=hour), memberships, user_events)
        for hour in SLOT_HOURS
        if day.replace(hour=hour) >= now
    ]


def _serialise_responses(responses):
    return [{"user_id": r.user.id, "username": r.user.username, "status": r.status} for r in responses]


def _build_member_statuses(suggestion, memberships):
    responses_by_user = {response.user_id: response.status for response in suggestion.responses.all()}
    member_statuses = []
    for membership in memberships:
        user = membership.user
        is_suggester = user.id == suggestion.suggested_by_id
        status = responses_by_user.get(user.id, "accepted" if is_suggester else "pending")
        member_statuses.append({
            **_build_member_payload(user),
            "status": status,
            "is_suggester": is_suggester,
        })
    return member_statuses


def _serialise_active_suggestion(suggestion, memberships):
    member_statuses = _build_member_statuses(suggestion, memberships)
    accepted_count = sum(1 for member in member_statuses if member["status"] == "accepted")
    rejected_count = sum(1 for member in member_statuses if member["status"] == "rejected")
    pending_count = sum(1 for member in member_statuses if member["status"] == "pending")
    team_size = len(member_statuses)
    return {
        "id": suggestion.id,
        "start": suggestion.start_time.isoformat(),
        "end": suggestion.end_time.isoformat(),
        "suggested_by": {"id": suggestion.suggested_by.id, "username": suggestion.suggested_by.username},
        "responses": _serialise_responses(suggestion.responses.all()),
        "member_statuses": member_statuses,
        "accepted_count": accepted_count,
        "rejected_count": rejected_count,
        "pending_count": pending_count,
        "team_size": team_size,
        "is_confirmed": team_size > 0 and accepted_count == team_size,
    }


def _get_active_suggestions(project, memberships):
    qs = (
        project.suggestions
        .filter(start_time__gte=timezone.now())
        .select_related("suggested_by")
        .prefetch_related("responses__user")
        .order_by("start_time", "created_at")
    )
    return [_serialise_active_suggestion(s, memberships) for s in qs]


def _group_slots_by_day(slots):
    grouped = {}
    for slot in sorted(slots, key=lambda s: (-s["free_count"], s["start"])):
        grouped.setdefault(slot["start"][:10], []).append(slot)
    return grouped


def _slots_at_layer(grouped, ordered_days, layer):
    return [grouped[day][layer] for day in ordered_days if layer < len(grouped[day])]


def _all_layer_slots(grouped, ordered_days):
    max_layers = max((len(v) for v in grouped.values()), default=0)
    return [slot for layer in range(max_layers) for slot in _slots_at_layer(grouped, ordered_days, layer)]


def _select_diverse_slots(slots, limit=SLOT_LIMIT):
    grouped = _group_slots_by_day(slots)
    ordered_days = sorted(grouped.keys())
    selected = _all_layer_slots(grouped, ordered_days)[:limit]
    return sorted(selected, key=lambda s: s["start"])


def _build_availability_response(project, current_user):
    memberships = list(project.memberships.select_related("user").order_by("joined_at", "user__username"))
    now = timezone.now()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    user_events = _get_user_events([m.user for m in memberships], start, start + timedelta(days=7))
    slots = []
    for i in range(7):
        slots.extend(_get_day_suggestions(start + timedelta(days=i), now, memberships, user_events))
    return {
        "current_user_id": current_user.id,
        "team_size": len(memberships),
        "project_members": [_build_member_payload(membership.user) for membership in memberships],
        "suggestions": _select_diverse_slots(slots),
        "active_suggestions": _get_active_suggestions(project, memberships),
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def group_availability(request, project_id):
    project = get_object_or_404(GroupProject.objects.filter(memberships__user=request.user), id=project_id)
    return Response(_build_availability_response(project, request.user))
