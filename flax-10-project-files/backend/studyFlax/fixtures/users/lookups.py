"""
User-facing lookup fixtures for categories, tags, and recurrence rules.
"""

category_fixtures = (
    ("Work", "#FF5733", True),
    ("University", "#33FF57", True),
    ("Personal", "#3357FF", True),
    ("Chores", "#FF33A8", False),
    ("Social", "#A833FF", False),
    ("Health", "#33FFF5", False),
)

tag_fixtures = (
    ("Lecture", 120),
    ("Deadline", 0),
    ("Exam", 120),
    ("Schedule", 60),
    ("Meals", 45),
    ("Other", 30),
)

recurrence_fixtures = (
    ("daily", 1),
    ("weekly", 1),
    ("weekly", 2),
    ("monthly", 1),
)

__all__ = ["category_fixtures", "tag_fixtures", "recurrence_fixtures"]

