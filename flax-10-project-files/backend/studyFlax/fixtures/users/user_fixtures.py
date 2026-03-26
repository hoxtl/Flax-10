"""
User-level lookup tables and course configuration fixtures.
"""

from .courses import course_fixtures, course_to_module_prefixes, module_prefix_to_department
from .lookups import category_fixtures, recurrence_fixtures, tag_fixtures


__all__ = [
    "category_fixtures",
    "course_fixtures",
    "course_to_module_prefixes",
    "module_prefix_to_department",
    "recurrence_fixtures",
    "tag_fixtures",
]

