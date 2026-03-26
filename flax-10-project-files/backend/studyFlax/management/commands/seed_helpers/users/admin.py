"""
Seeds admin-facing data: course change requests and society reports.
Fixture users (janedoe, johndoe, charlie) are excluded as
requesters/reporters unless they request themselves.
"""

import random

from django.contrib.auth import get_user_model

from studyFlax.models.authentication.course_change_request_model import CourseChangeRequest
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
def _non_fixture_users():
    return list(
        User.objects.filter(role__in=["student", "teacher"]).exclude(username__in=FIXTURE_NAMES)
    )

def _create_course_change_if_missing(user, rng):
    """Create a pending course change request if none exists. Returns True if created."""
    if CourseChangeRequest.objects.filter(user=user, status="pending").exists():
        return False
    current = rng.choice(COURSES)
    requested = rng.choice([c for c in COURSES if c != current])
    CourseChangeRequest.objects.create(
        user=user,
        current_course=current,
        requested_course=requested,
        status="pending",
    )
    return True

def seed_course_change_requests(stdout):
    """Seed pending course-change requests for non-fixture users."""
    rng = random.Random("studyflax-course-changes-v1")
    pool = _non_fixture_users()
    if not pool:
        return
    count_target = min(14, len(pool))
    chosen = rng.sample(pool, count_target)
    created = sum(1 for user in chosen if _create_course_change_if_missing(user, rng))
    stdout.write(f"  \u2713  {'Course changes':<14} {created} created")

def _create_society_report_if_missing(society, reporter, reason, pairs_used):
    """Create a society report if not a duplicate pair. Returns True if created."""
    if (society.id, reporter.id) in pairs_used:
        return False
    pairs_used.add((society.id, reporter.id))
    if SocietyReport.objects.filter(society=society, reporter=reporter).exists():
        return False
    SocietyReport.objects.create(society=society, reporter=reporter, reason=reason)
    return True

def seed_society_reports(stdout):
    rng = random.Random("studyflax-society-reports-v1")
    societies = list(Society.objects.filter(is_ratified=True))
    pool = _non_fixture_users()
    if not societies or not pool:
        return
    pairs_used = set()
    target = min(12, len(societies), len(pool))
    candidates = list(rng.sample(societies, min(target, len(societies))))
    reporters = rng.sample(pool, min(target, len(pool)))
    created = sum(
        1 for i, society in enumerate(candidates)
        if _create_society_report_if_missing(society, reporters[i % len(reporters)], rng.choice(REPORT_REASONS), pairs_used)
    )
    stdout.write(f"  \u2713  {'Society reports':<14} {created} created")
