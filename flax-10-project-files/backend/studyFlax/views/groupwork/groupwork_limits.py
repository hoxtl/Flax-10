"""
Shared limits for group project enrolment.
"""

MAX_GROUP_PROJECTS_PER_USER = 12


def group_project_limit_message(limit=MAX_GROUP_PROJECTS_PER_USER):
    return f"You can be enrolled in up to {limit} group projects."
