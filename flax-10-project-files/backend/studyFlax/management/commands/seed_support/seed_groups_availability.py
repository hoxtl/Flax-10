"""
Availability seeding helpers: busy events and meeting suggestions.
"""

import random
from datetime import timedelta

from studyFlax.models.groupwork.groupwork_model import MeetingSuggestion, MeetingResponse
from studyFlax.models.calendar.calendar_event_model import CalendarEvent

SEEDED_SUGGESTION_COUNT = 4
SEEDED_SUGGESTION_WINDOWS = (
    (1, 10),
    (2, 14),
    (3, 17),
    (4, 11),
    (5, 15),
    (6, 13),
)
SEEDED_RESPONSE_PATTERNS = (
    ("accepted", "accepted", "accepted", "accepted", "accepted"),
    ("accepted", "accepted", "pending", "accepted", "rejected"),
    ("accepted", "pending", "accepted", "rejected", "accepted"),
    ("accepted", "rejected", "accepted", "accepted", "pending"),
)


def _seed_busy_events_for_member(member, project_id, now):
    member_rng = random.Random(f"avail-busy-{project_id}-{member.username}")
    num_busy = member_rng.randint(2, 4)
    hours_pool = [9, 10, 11, 12, 13, 14, 15, 16, 17]
    for i in range(num_busy):
        day_offset = member_rng.randint(0, 6)
        hour = member_rng.choice(hours_pool)
        start = (now + timedelta(days=day_offset)).replace(hour=hour, minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=1 if member_rng.random() < 0.75 else 2)
        CalendarEvent.objects.get_or_create(
            user=member,
            title="Busy",
            start_time=start,
            defaults={"end_time": end, "source": "seed_availability"},
        )

def _resolve_response_status(suggestion_index, member, suggested_by, pattern, member_index):
    """Return the meeting response status for one member."""
    if suggestion_index == 0 or member == suggested_by:
        return "accepted"
    return pattern[member_index % len(pattern)]

def _seed_meeting_responses_for_suggestion(suggestion, members, suggestion_index):
    pattern = SEEDED_RESPONSE_PATTERNS[suggestion_index % len(SEEDED_RESPONSE_PATTERNS)]
    for member_index, member in enumerate(members):
        status = _resolve_response_status(suggestion_index, member, suggestion.suggested_by, pattern, member_index)
        MeetingResponse.objects.update_or_create(
            suggestion=suggestion,
            user=member,
            defaults={"status": status},
        )

def _create_suggestion_with_responses(project, suggester, start, end, members, idx):
    """Create or update a meeting suggestion and seed its responses."""
    suggestion, _ = MeetingSuggestion.objects.update_or_create(
        project=project,
        suggested_by=suggester,
        start_time=start,
        defaults={"end_time": end},
    )
    _seed_meeting_responses_for_suggestion(suggestion, members, idx)

def _seed_meeting_suggestions_for_project(project, members, now):
    if not members:
        return
    suggestion_rng = random.Random(f"suggestions-{project.id}-{project.name}")
    windows = list(SEEDED_SUGGESTION_WINDOWS)
    suggestion_rng.shuffle(windows)
    selected_windows = sorted(windows[:SEEDED_SUGGESTION_COUNT], key=lambda item: (item[0], item[1]))
    suggesters = [member for member in members if member != project.owner] or members
    for idx, (day_offset, hour) in enumerate(selected_windows):
        suggester = suggesters[idx % len(suggesters)]
        start = (now + timedelta(days=day_offset)).replace(hour=hour, minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=1)
        _create_suggestion_with_responses(project, suggester, start, end, members, idx)
