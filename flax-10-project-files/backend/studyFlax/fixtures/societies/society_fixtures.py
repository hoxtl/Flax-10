"""
Builders for seeded society payloads.
"""

from .about import _join_tags, _normalise_phrase, build_rich_about
from .catalogue import CATEGORY_MAPPING, SOCIETY_DATA
from .events import build_event_datetime, get_events_for_category, get_next_occurrence
from .images import get_random_category_image


def build_society_dict(name, bio, about, category, tags):
    """Build one seeded society payload for the society seeding command."""

    image = get_random_category_image(category)
    mapped_category = CATEGORY_MAPPING.get(category, category)
    return {
        "name": name,
        "bio": bio,
        "about": build_rich_about(name, bio, about, category, tags),
        "categories": [mapped_category],
        "tags": tags,
        "events": get_events_for_category(category),
        "image": f"http://localhost:8000/static/seed_images/societies/{image}",
    }


def build_society_seed_data():
    """Build the full seeded society dataset."""

    return [
        build_society_dict(name, bio, about, category, tags)
        for name, bio, about, category, tags in SOCIETY_DATA
    ]


__all__ = [
    "_join_tags",
    "_normalise_phrase",
    "build_event_datetime",
    "build_rich_about",
    "build_society_dict",
    "build_society_seed_data",
    "get_events_for_category",
    "get_next_occurrence",
    "get_random_category_image",
]
