"""
Seeds admin-facing data: pending teacher requests, course change requests,
and society reports. Fixture users (janedoe, johndoe, charlie) are excluded
as requesters/reporters unless they request themselves.
"""

import random

from django.contrib.auth import get_user_model

from studyFlax.models.auth.course_change_request_model import CourseChangeRequest
from studyFlax.models.society.society_report_model import SocietyReport
from studyFlax.models.society.society_model import Society

User = get_user_model()

FIXTURE_NAMES = {"janedoe", "johndoe", "charlie"}

COURSES = [
    "Computer Science", "Software Engineering", "Data Science",
    "Artificial Intelligence", "Cyber Security", "Information Systems",
    "Mathematics", "Physics", "Electrical Engineering", "Mechanical Engineering",
    "Business Management", "Economics", "Psychology", "Biomedical Science",
    "Chemistry", "Bioinformatics",
]

REPORT_REASONS = [
    "Spreading misinformation in posts",
    "Hostile and unwelcoming community",
    "Inappropriate content shared in events",
    "Spamming members with unsolicited messages",
    "Leadership acting abusively towards members",
    "Society events are misrepresented or misleading",
    "Discriminatory language used in announcements",
    "Not following university society guidelines",
    "Organising events without proper approval",
    "Impersonating another society",
]


def _non_fixture_students():
    return list(User.objects.filter(role="student").exclude(username__in=FIXTURE_NAMES))


def _non_fixture_users():
    return list(
        User.objects.filter(role__in=["student", "teacher"]).exclude(username__in=FIXTURE_NAMES)
    )


def _promote_to_pending_teacher(user):
    """Promote user to pending_teacher role if not already. Returns 1 if changed."""
    if user.role == "pending_teacher":
        return 0
    user.role = "pending_teacher"
    user.save(update_fields=["role"])
    return 1

def seed_teacher_requests(stdout):
    rng = random.Random("studyflax-teacher-requests-v1")
    pool = _non_fixture_students()
    if not pool:
        return
    chosen = rng.sample(pool, min(10, len(pool)))
    updated = sum(_promote_to_pending_teacher(u) for u in chosen)
    stdout.write(f"  \u2713  {'Teacher requests':<14} {updated} new pending")


def _create_course_change(user, rng):
    """Create a pending course change request for user. Returns 1 if created."""
    if CourseChangeRequest.objects.filter(user=user, status="pending").exists():
        return 0
    current = rng.choice(COURSES)
    requested = rng.choice([c for c in COURSES if c != current])
    CourseChangeRequest.objects.create(
        user=user, current_course=current,
        requested_course=requested, status="pending",
    )
    return 1

def seed_course_change_requests(stdout):
    rng = random.Random("studyflax-course-changes-v1")
    pool = _non_fixture_users()
    if not pool:
        return
    chosen = rng.sample(pool, min(14, len(pool)))
    created = sum(_create_course_change(user, rng) for user in chosen)
    stdout.write(f"  \u2713  {'Course changes':<14} {created} created")


def _create_society_report(society, reporter, reason, pairs_used):
    """Create a society report if the pair hasn't been used. Returns 1 if created."""
    if (society.id, reporter.id) in pairs_used:
        return 0
    pairs_used.add((society.id, reporter.id))
    if SocietyReport.objects.filter(society=society, reporter=reporter).exists():
        return 0
    SocietyReport.objects.create(society=society, reporter=reporter, reason=reason)
    return 1

def seed_society_reports(stdout):
    rng = random.Random("studyflax-society-reports-v1")
    societies = list(Society.objects.filter(is_ratified=True))
    pool = _non_fixture_users()
    if not societies or not pool:
        return
    target = min(12, len(societies), len(pool))
    candidates = list(rng.sample(societies, min(target, len(societies))))
    reporters = rng.sample(pool, min(target, len(pool)))
    pairs_used = set()
    created = sum(
        _create_society_report(s, reporters[i % len(reporters)], rng.choice(REPORT_REASONS), pairs_used)
        for i, s in enumerate(candidates)
    )
    stdout.write(f"  \u2713  {'Society reports':<14} {created} created")
