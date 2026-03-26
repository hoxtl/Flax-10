"""
Builds module enrolments and overlap-aware calendar events.
"""

from collections import defaultdict

from studyFlax.models import CalendarEvent, Enrollment

from ..calendar.event_helpers import build_deadline_event, get_user_modules
from ..calendar.overlap_utils import (
    candidate_slots,
    event_day,
    event_duration,
    event_sort_key,
    fits_overlap_cap,
)
from ..calendar.session_events import build_module_sessions, build_session_event, session_tag

MAX_FIXED_EVENT_OVERLAPS = 2
FIXED_EVENT_DAY_START_HOUR = 8
FIXED_EVENT_DAY_END_HOUR = 20
FIXED_EVENT_SLOT_STEP_MINUTES = 30


def _deadline_tag(deadline, deadline_tag, exam_tag):
    """Return the correct tag for a deadline event."""

    return exam_tag if deadline.deadline_type == 'exam' else deadline_tag


def _build_user_session_events(user, module, tags, now):
    """Build unsaved session events for a user's module."""

    lecture_tag, _, _, schedule_tag = tags
    events = []
    for session in build_module_sessions(module, now):
        tag = session_tag(session, lecture_tag, schedule_tag)
        events.append(build_session_event(user, session, tag))
    return events


def _build_user_deadline_events(user, module, tags, deadlines_by_module):
    """Build unsaved deadline events for a user's module."""

    _, deadline_tag, exam_tag, _ = tags
    events = []
    for deadline in deadlines_by_module.get(module.id, []):
        tag = _deadline_tag(deadline, deadline_tag, exam_tag)
        events.append(build_deadline_event(user, deadline, tag))
    return events


def _is_seeded_timetable_event(event):
    """Return whether an event is a seeded timetable session."""

    return (getattr(event, 'source', '') or '').lower() == 'timetable'


def _is_fixed_seed_event(event):
    """Return whether an event is fixed in time during seeding."""

    source = (getattr(event, 'source', '') or '').lower()
    return source == 'timetable' or source.startswith('module_') or source == 'society'


def _baseline_events_by_day(baseline_events):
    """Group baseline events by day."""

    grouped = defaultdict(list)
    for event in baseline_events or []:
        grouped[event_day(event)].append(event)
    return grouped


def _bucket_seeded_event(event, fixed_by_day, movable_sessions_by_day):
    """Place one seeded event into the correct day bucket."""

    if _is_seeded_timetable_event(event):
        movable_sessions_by_day[event_day(event)].append(event)
        return
    if _is_fixed_seed_event(event):
        fixed_by_day[event_day(event)].append(event)


def _bucket_seeded_events(events):
    """Group seeded events by day and flexibility."""

    fixed_by_day = defaultdict(list)
    movable_sessions_by_day = defaultdict(list)
    for event in events:
        _bucket_seeded_event(event, fixed_by_day, movable_sessions_by_day)
    return fixed_by_day, movable_sessions_by_day


def _day_fixed_events(day, fixed_by_day, baseline_by_day):
    """Return fixed events already placed on a day."""

    placed = baseline_by_day.get(day, []) + fixed_by_day.get(day, [])
    return sorted(placed, key=event_sort_key)


def _candidate_window(candidate, duration):
    """Return the start and end time for a candidate slot."""

    return candidate, candidate + duration


def _slot_candidates(session, duration):
    """Return ordered slot candidates for one session."""

    return candidate_slots(
        session,
        duration,
        FIXED_EVENT_DAY_START_HOUR,
        FIXED_EVENT_DAY_END_HOUR,
        FIXED_EVENT_SLOT_STEP_MINUTES,
    )


def _candidate_window_if_available(candidate, duration, placed):
    """Return a candidate window when it fits the overlap cap."""

    start_time, end_time = _candidate_window(candidate, duration)
    if not fits_overlap_cap(start_time, end_time, placed, MAX_FIXED_EVENT_OVERLAPS):
        return None
    return start_time, end_time


def _available_windows(session, duration, placed):
    """Yield valid windows for a movable session."""

    return (
        _candidate_window_if_available(candidate, duration, placed)
        for candidate in _slot_candidates(session, duration)
    )


def _session_window(session, placed):
    """Return the scheduled window for a session."""

    start_time = session.start_time
    end_time = session.end_time
    if fits_overlap_cap(start_time, end_time, placed, MAX_FIXED_EVENT_OVERLAPS):
        return start_time, end_time
    duration = event_duration(session)
    return next((window for window in _available_windows(session, duration, placed) if window), (start_time, end_time))


def _update_timetable_external_id(event, start_time):
    """Update timetable external IDs after moving a session."""

    external_id = getattr(event, 'external_id', None)
    if not external_id:
        return
    prefix, separator, _ = str(external_id).rpartition('-')
    if prefix and separator:
        event.external_id = f"{prefix}-{start_time.strftime('%Y%m%dT%H%M')}"


def _place_day_sessions(day_sessions, placed):
    """Place movable sessions for one day."""

    for session in sorted(day_sessions, key=event_sort_key):
        start_time, end_time = _session_window(session, placed)
        session.start_time = start_time
        session.end_time = end_time
        _update_timetable_external_id(session, start_time)
        placed.append(session)


def _rebalance_seeded_fixed_events(events, baseline_events=None):
    """Rebalance movable timetable sessions around fixed events."""

    baseline_by_day = _baseline_events_by_day(baseline_events)
    fixed_by_day, movable_sessions_by_day = _bucket_seeded_events(events)
    for day, day_sessions in movable_sessions_by_day.items():
        _place_day_sessions(day_sessions, _day_fixed_events(day, fixed_by_day, baseline_by_day))
    return events


def _should_enroll(user, module):
    """Return whether a user still needs this module enrolment."""

    return not Enrollment.objects.filter(student=user, module=module).exists()


def _process_single_module(user, module, tags, now, deadlines_by_module):
    """Build enrolment and events for a single module."""

    enrollment = Enrollment(student=user, module=module) if _should_enroll(user, module) else None
    session_events = _build_user_session_events(user, module, tags, now)
    deadline_events = _build_user_deadline_events(user, module, tags, deadlines_by_module)
    return enrollment, session_events + deadline_events


def _collect_module_result(enrollment, module_events, enrollments, events):
    """Append module results to the shared accumulators."""

    if enrollment:
        enrollments.append(enrollment)
    events.extend(module_events)


def build_user_module_events(user, modules, tags, now, deadlines_by_module, baseline_events=None):
    """Build all enrolments and events for one user's modules."""

    core, extras = get_user_modules(user, modules)
    enrollments, events = [], []
    for module in core + extras:
        enrollment, module_events = _process_single_module(user, module, tags, now, deadlines_by_module)
        _collect_module_result(enrollment, module_events, enrollments, events)
    return enrollments, _rebalance_seeded_fixed_events(events, baseline_events=baseline_events)


def _find_user_tag(user, tags, name):
    """Find a tag by name for a user."""

    return next((tag for tag in tags if tag.name == name and (tag.user_id == user.id or tag.is_default)), None)


def _get_user_module_tags(user, tags):
    """Return the module-related tags for a user."""

    return (
        _find_user_tag(user, tags, 'Lecture'),
        _find_user_tag(user, tags, 'Deadline'),
        _find_user_tag(user, tags, 'Exam'),
        _find_user_tag(user, tags, 'Schedule'),
    )


def prefetch_existing_calendar_events(users):
    """Fetch already-seeded events grouped by user."""

    existing = (
        CalendarEvent.objects.filter(user__in=users)
        .only('user_id', 'start_time', 'end_time', 'source', 'external_id', 'title')
    )
    grouped = defaultdict(list)
    for event in existing:
        grouped[event.user_id].append(event)
    return grouped


def _user_module_result(user, modules, tags, now, deadlines_by_module, existing_events_by_user):
    """Build module results for one user."""

    user_tags = _get_user_module_tags(user, tags)
    baseline_events = existing_events_by_user.get(user.id, [])
    return build_user_module_events(user, modules, user_tags, now, deadlines_by_module, baseline_events=baseline_events)


def collect_all_enrollments_and_events(users, modules, tags, now, deadlines_by_module):
    """Collect module enrolments and events for all users."""

    all_enrollments, all_events = [], []
    existing_events_by_user = prefetch_existing_calendar_events(users)
    for user in users:
        enrollments, events = _user_module_result(user, modules, tags, now, deadlines_by_module, existing_events_by_user)
        all_enrollments.extend(enrollments)
        all_events.extend(events)
    return all_enrollments, all_events
