"""
Fixture owner helpers for seeded group projects.
"""

FIXTURE_USERNAMES = ["janedoe", "johndoe", "charlie"]
FIXTURE_OWNER_MIN_PROJECTS = 2


def _fixture_seed_users(students):
    """Filter fixture seed users."""
    usernames = set(FIXTURE_USERNAMES)
    return [student for student in students if student.username in usernames]

def _is_fixture_project_blocked(project, student, ownership_counts):
    """Check whether fixture reassignment is blocked."""
    if project.owner_id == student.id:
        return True
    owner_username = getattr(project.owner, "username", "")
    owner_is_fixture = owner_username in FIXTURE_USERNAMES
    return owner_is_fixture and ownership_counts.get(project.owner_id, 0) <= FIXTURE_OWNER_MIN_PROJECTS

def _fixture_project_sort_key(project, module_codes, ownership_counts, rng):
    owner_username = getattr(project.owner, "username", "")
    owner_is_fixture = owner_username in FIXTURE_USERNAMES
    return (0 if project.course_code in module_codes else 1, 0 if not owner_is_fixture else 1, ownership_counts.get(project.owner_id, 0), rng.random())

def _fixture_project_candidate(project, student, module_codes, ownership_counts, rng):
    if _is_fixture_project_blocked(project, student, ownership_counts):
        return None
    return _fixture_project_sort_key(project, module_codes, ownership_counts, rng), project

def _pick_project_for_fixture_owner(student, projects, target_module_codes, ownership_counts, rng):
    module_codes = target_module_codes.get(student.id, set())
    candidates = [_fixture_project_candidate(p, student, module_codes, ownership_counts, rng) for p in projects]
    valid = sorted([c for c in candidates if c is not None], key=lambda item: item[0])
    return valid[0][1] if valid else None
