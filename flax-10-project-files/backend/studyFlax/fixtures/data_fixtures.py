from .user_fixtures import (
    category_fixtures,
    tag_fixtures,
    recurrence_fixtures,
    course_fixtures,
    course_to_module_prefixes,
    module_prefix_to_department,
)
from .event_fixtures import (
    event_title_fixtures,
    breakfast_fixtures,
    lunch_fixtures,
    dinner_fixtures,
    description_fixtures,
    location_fixtures,
    lecture_theatre_fixtures,
)
from .module_fixtures import module_fixtures
from .deadline_fixtures import deadline_fixtures, module_deadline_fixtures
from .society_fixtures import SOCIETY_DATA

__all__ = [
    "category_fixtures",
    "tag_fixtures",
    "recurrence_fixtures",
    "course_fixtures",
    "course_to_module_prefixes",
    "module_prefix_to_department",
    "event_title_fixtures",
    "breakfast_fixtures",
    "lunch_fixtures",
    "dinner_fixtures",
    "description_fixtures",
    "location_fixtures",
    "lecture_theatre_fixtures",
    "module_fixtures",
    "deadline_fixtures",
    "module_deadline_fixtures",
    "SOCIETY_DATA",
]
