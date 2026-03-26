"""
User fixture exports for seeded lookup data.
"""

from .user_fixtures import (
    category_fixtures,
    course_fixtures,
    course_to_module_prefixes,
    module_prefix_to_department,
    recurrence_fixtures,
    tag_fixtures,
)


__all__ = [
    "category_fixtures",
    "course_fixtures",
    "course_to_module_prefixes",
    "module_prefix_to_department",
    "recurrence_fixtures",
    "tag_fixtures",
]

