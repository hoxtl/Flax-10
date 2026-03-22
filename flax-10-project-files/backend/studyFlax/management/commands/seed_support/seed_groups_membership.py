import random
from datetime import timedelta

from django.db.models import Count
from django.utils import timezone

from studyFlax.models.tasks.task_model import Task
from studyFlax.models.groupwork.groupwork_model import GroupMembership
from studyFlax.fixtures.groupwork_fixtures import GROUP_TASK_TEMPLATES
from studyFlax.management.commands.seed_support.seed_groups_helpers import (
    FIXTURE_USERNAMES,
    FIXTURE_OWNER_MIN_PROJECTS,
    MIN_PROJECT_MEMBER_TOTAL,
    MAX_PROJECT_MEMBER_TOTAL,
    MIN_PROJECTS_PER_STUDENT,
    MAX_PROJECTS_PER_STUDENT,
    PROJECT_TASK_SEED,
    PROJECT_TASK_STATUS_PATTERNS,
    ZERO_PROGRESS_PROJECT_COUNT,
    SEEDED_SUGGESTION_COUNT,
    SEEDED_SUGGESTION_WINDOWS,
    SEEDED_RESPONSE_PATTERNS,
    _dedupe_users,
    _sync_project_owner_membership,
    _student_module_codes,
)


def _candidate_sort_key(project, module_codes, ownership_counts, rng):
    owner_username = getattr(project.owner, "username", "")
    owner_is_fixture = owner_username in FIXTURE_USERNAMES
    return (
        0 if project.course_code in module_codes else 1,
        0 if not owner_is_fixture else 1,
        ownership_counts.get(project.owner_id, 0),
        rng.random(),
    )


def _is_candidate_eligible(project, student, ownership_counts):
    if project.owner_id == student.id:
        return False
    owner_username = getattr(project.owner, "username", "")
    owner_is_fixture = owner_username in FIXTURE_USERNAMES
    owner_has_spare = ownership_counts.get(project.owner_id, 0) > FIXTURE_OWNER_MIN_PROJECTS
    return not (owner_is_fixture and not owner_has_spare)


def _pick_project_for_fixture_owner(student, projects, target_module_codes, ownership_counts, rng):
    module_codes = target_module_codes.get(student.id, set())
    candidates = [
        (_candidate_sort_key(project, module_codes, ownership_counts, rng), project)
        for project in projects
        if _is_candidate_eligible(project, student, ownership_counts)
    ]
    if not candidates:
        return None
    candidates.sort(key=lambda item: item[0])
    return candidates[0][1]


def _select_project_cohort(project, students, module_students):
    cohort = _dedupe_users(module_students.get(project.course_code, []))
    if len(cohort) >= MIN_PROJECT_MEMBER_TOTAL:
        return cohort
    fallback_students = [s for s in students if s.id not in {m.id for m in cohort}]
    return _dedupe_users(cohort + fallback_students)


def _build_membership_counts(students, project_ids=None):
    counts = {student.id: 0 for student in students}
    memberships = GroupMembership.objects.filter(user__in=students)
    if project_ids is not None:
        memberships = memberships.filter(project_id__in=project_ids)
    rows = memberships.values("user").annotate(total=Count("id"))
    for row in rows:
        counts[row["user"]] = row["total"]
    return counts


def _member_rank_key(student, cohort_ids, membership_counts, rng):
    current_count = membership_counts.get(student.id, 0)
    return (
        0 if current_count < MIN_PROJECTS_PER_STUDENT else 1,
        0 if student.id in cohort_ids else 1,
        0 if current_count < MAX_PROJECTS_PER_STUDENT else 1,
        current_count,
        rng.random(),
    )


def _rank_candidate(student, project, cohort_ids, membership_counts, rng, allow_over_limit):
    current_count = membership_counts.get(student.id, 0)
    if student == project.owner:
        return None
    if not allow_over_limit and current_count >= MAX_PROJECTS_PER_STUDENT:
        return None
    return (_member_rank_key(student, cohort_ids, membership_counts, rng), student)


def _ordered_member_candidates(project, students, module_students, membership_counts, rng, allow_over_limit=False):
    cohort = _select_project_cohort(project, students, module_students)
    cohort_ids = {s.id for s in cohort}
    ranked = [
        _rank_candidate(s, project, cohort_ids, membership_counts, rng, allow_over_limit)
        for s in _dedupe_users(cohort + students)
    ]
    ranked = [r for r in ranked if r is not None]
    ranked.sort(key=lambda item: item[0])
    return [s for _, s in ranked]


def _compute_target_total(candidate_pool, rng):
    max_total = min(MAX_PROJECT_MEMBER_TOTAL, 1 + len(candidate_pool))
    if max_total <= 1:
        return 1
    requested_total = rng.randint(MIN_PROJECT_MEMBER_TOTAL, MAX_PROJECT_MEMBER_TOTAL)
    minimum_total = min(MIN_PROJECT_MEMBER_TOTAL, max_total)
    return max(minimum_total, min(requested_total, max_total))


def _add_members_to_project(project, students, rng, showcase_student, module_students, membership_counts):
    del showcase_student
    candidate_pool = _ordered_member_candidates(project, students, module_students, membership_counts, rng)
    target_total = _compute_target_total(candidate_pool, rng)
    members = candidate_pool[:max(target_total - 1, 0)]
    selected_ids = {m.id for m in members}
    GroupMembership.objects.filter(project=project).exclude(user=project.owner).exclude(user_id__in=selected_ids).delete()
    for member in members:
        GroupMembership.objects.update_or_create(project=project, user=member, defaults={"role": "member"})
        membership_counts[member.id] = membership_counts.get(member.id, 0) + 1


def _project_member_sets(projects):
    return {
        project.id: {ms.user_id for ms in project.memberships.all()}
        for project in projects
    }


def _top_up_sort_key(project, student_module_codes, member_sets, rng):
    return (0 if project.course_code in student_module_codes else 1, len(member_sets.get(project.id, set())), rng.random())


def _ordered_top_up_projects(student, projects, member_sets, module_codes, rng):
    student_module_codes = module_codes.get(student.id, set())
    eligible = [
        p for p in projects
        if student.id not in member_sets.get(p.id, set()) and len(member_sets.get(p.id, set())) < MAX_PROJECT_MEMBER_TOTAL
    ]
    ranked = [(_top_up_sort_key(p, student_module_codes, member_sets, rng), p) for p in eligible]
    ranked.sort(key=lambda item: item[0])
    return [p for _, p in ranked]


def _top_up_single_student(student, projects, member_sets, module_codes, membership_counts, rng):
    candidate_projects = _ordered_top_up_projects(student, projects, member_sets, module_codes, rng)
    made_progress = False
    while membership_counts.get(student.id, 0) < MIN_PROJECTS_PER_STUDENT and candidate_projects:
        project = candidate_projects.pop(0)
        GroupMembership.objects.update_or_create(project=project, user=student, defaults={"role": "member"})
        member_sets.setdefault(project.id, set()).add(student.id)
        membership_counts[student.id] = membership_counts.get(student.id, 0) + 1
        made_progress = True
    return made_progress


def _under_assigned_students(students, membership_counts):
    return sorted(
        [s for s in students if membership_counts.get(s.id, 0) < MIN_PROJECTS_PER_STUDENT],
        key=lambda s: (membership_counts.get(s.id, 0), s.username),
    )


def _top_up_pass(students, projects, member_sets, module_codes, membership_counts, rng):
    return any(
        _top_up_single_student(s, projects, member_sets, module_codes, membership_counts, rng)
        for s in _under_assigned_students(students, membership_counts)
    )


def _top_up_students_to_minimum(projects, students, student_modules, membership_counts, rng):
    module_codes = _student_module_codes(student_modules)
    member_sets = _project_member_sets(projects)
    while _top_up_pass(students, projects, member_sets, module_codes, membership_counts, rng):
        pass


def _underfilled_projects_sorted(projects, member_sets):
    underfilled = [p for p in projects if len(member_sets.get(p.id, set())) < MIN_PROJECT_MEMBER_TOTAL]
    return sorted(
        underfilled,
        key=lambda p: (len(member_sets.get(p.id, set())), p.deadline or timezone.now(), p.name),
    )


def _add_one_member(project, member, member_sets, membership_counts):
    GroupMembership.objects.update_or_create(project=project, user=member, defaults={"role": "member"})
    member_sets.setdefault(project.id, set()).add(member.id)
    membership_counts[member.id] = membership_counts.get(member.id, 0) + 1


def _fill_project_to_minimum(project, students, module_students, membership_counts, member_sets, rng):
    needed = MIN_PROJECT_MEMBER_TOTAL - len(member_sets.get(project.id, set()))
    made_progress = False
    candidates = _ordered_member_candidates(project, students, module_students, membership_counts, rng)
    eligible = [m for m in candidates if m.id not in member_sets.get(project.id, set())]
    for member in eligible[:needed]:
        _add_one_member(project, member, member_sets, membership_counts)
        made_progress = True
    return made_progress


def _fill_minimum_pass(projects, students, module_students, membership_counts, member_sets, rng):
    return any(
        _fill_project_to_minimum(p, students, module_students, membership_counts, member_sets, rng)
        for p in _underfilled_projects_sorted(projects, member_sets)
    )


def _ensure_projects_have_minimum_members(projects, students, module_students, membership_counts, rng):
    member_sets = _project_member_sets(projects)
    while _fill_minimum_pass(projects, students, module_students, membership_counts, member_sets, rng):
        pass


def _fill_project_to_duo(project, students, module_students, membership_counts, member_sets, rng):
    needed = 2 - len(member_sets.get(project.id, set()))
    if needed <= 0:
        return
    candidates = _ordered_member_candidates(project, students, module_students, membership_counts, rng, allow_over_limit=True)
    eligible = [m for m in candidates if m.id not in member_sets.get(project.id, set())]
    for member in eligible[:needed]:
        _add_one_member(project, member, member_sets, membership_counts)


def _ensure_projects_have_teammates(projects, students, module_students, membership_counts, rng):
    member_sets = _project_member_sets(projects)
    solo_projects = sorted(
        [p for p in projects if len(member_sets.get(p.id, set())) < 2],
        key=lambda p: (len(member_sets.get(p.id, set())), p.deadline or timezone.now(), p.name),
    )
    for project in solo_projects:
        _fill_project_to_duo(project, students, module_students, membership_counts, member_sets, rng)


def _get_project_status_pattern(project, project_index):
    if project_index < ZERO_PROGRESS_PROJECT_COUNT:
        return PROJECT_TASK_STATUS_PATTERNS[0]
    non_zero_count = max(len(PROJECT_TASK_STATUS_PATTERNS) - 1, 1)
    pattern_index = 1 + (sum(ord(char) for char in f"{project.course_code}:{project.name}") % non_zero_count)
    return PROJECT_TASK_STATUS_PATTERNS[pattern_index]


def _build_completed_fields(status, task_index, now):
    is_completed = (status == 'done')
    completed_at = now - timedelta(days=min(task_index, 4)) if is_completed else None
    return is_completed, completed_at


def _build_task_due_date(due, task_index, now):
    lead_days = max(0, min(task_index + 1, max((due.date() - now.date()).days, 0)))
    return due - timedelta(days=lead_days)


def _pick_task_assignees(members, task_index):
    primary = members[task_index % len(members)]
    if len(members) > 1 and task_index % 2 == 0:
        secondary = members[(task_index + 1) % len(members)]
        return [primary, secondary]
    return [primary]


def _build_task_defaults(project, template, status, is_completed, completed_at, task_due):
    t_title, t_desc, t_priority, t_blocks = template
    return t_title, {
        'user': project.owner,
        'description': t_desc,
        'priority': t_priority,
        'estimated_blocks': t_blocks,
        'status': status,
        'completed': is_completed,
        'completed_at': completed_at,
        'due_date': task_due,
    }


def _create_single_group_task(project, members, due, template, task_index, now, rng, status_pattern):
    status = status_pattern[task_index % len(status_pattern)]
    is_completed, completed_at = _build_completed_fields(status, task_index, now)
    has_due_date = not (status == "todo" and task_index >= 3)
    task_due = _build_task_due_date(due, task_index, now) if has_due_date else None
    t_title, defaults = _build_task_defaults(project, template, status, is_completed, completed_at, task_due)
    task, _ = Task.objects.update_or_create(group_project=project, title=t_title, defaults=defaults)
    task.assigned_to.set(_pick_task_assignees(members, task_index))


def _seed_tasks_for_project(project, now, project_index):
    members = sorted([m.user for m in project.memberships.all()], key=lambda u: u.username)
    if not members:
        return
    due = project.deadline or (now + timedelta(days=14))
    rng = random.Random(f"{PROJECT_TASK_SEED}:{project.name}")
    status_pattern = _get_project_status_pattern(project, project_index)
    for task_index, template in enumerate(GROUP_TASK_TEMPLATES):
        _create_single_group_task(project, members, due, template, task_index, now, rng, status_pattern)


def _seed_busy_events_for_member(member, project_id, now):
    from studyFlax.models.calendar.calendar_event_model import CalendarEvent
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


def _response_status_for_member(suggestion, suggestion_index, member, pattern, member_index):
    status = pattern[member_index % len(pattern)]
    if suggestion_index == 0 or member == suggestion.suggested_by:
        return "accepted"
    return status


def _seed_meeting_responses_for_suggestion(suggestion, members, suggestion_index):
    from studyFlax.models.groupwork.groupwork_model import MeetingResponse
    pattern = SEEDED_RESPONSE_PATTERNS[suggestion_index % len(SEEDED_RESPONSE_PATTERNS)]
    for member_index, member in enumerate(members):
        status = _response_status_for_member(suggestion, suggestion_index, member, pattern, member_index)
        MeetingResponse.objects.update_or_create(
            suggestion=suggestion,
            user=member,
            defaults={"status": status},
        )


def _build_suggestion_windows(project):
    suggestion_rng = random.Random(f"suggestions-{project.id}-{project.name}")
    windows = list(SEEDED_SUGGESTION_WINDOWS)
    suggestion_rng.shuffle(windows)
    return sorted(windows[:SEEDED_SUGGESTION_COUNT], key=lambda item: (item[0], item[1])), suggestion_rng


def _seed_meeting_suggestions_for_project(project, members, now):
    from studyFlax.models.groupwork.groupwork_model import MeetingSuggestion
    if not members:
        return
    selected_windows, suggestion_rng = _build_suggestion_windows(project)
    suggesters = [m for m in members if m != project.owner] or members
    for idx, (day_offset, hour) in enumerate(selected_windows):
        suggester = suggesters[idx % len(suggesters)]
        start = (now + timedelta(days=day_offset)).replace(hour=hour, minute=0, second=0, microsecond=0)
        end = start + timedelta(hours=1)
        suggestion, _ = MeetingSuggestion.objects.update_or_create(
            project=project,
            suggested_by=suggester,
            start_time=start,
            defaults={"end_time": end},
        )
        _seed_meeting_responses_for_suggestion(suggestion, members, idx)
